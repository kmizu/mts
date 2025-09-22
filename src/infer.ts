// Hindley-Milner Type Inference Engine for MTS

import {
  applySubstitution,
  arrayType,
  booleanType,
  composeSubstitutions,
  Constraint,
  freeTypeVars,
  freeTypeVarsInEnv,
  freshTypeVar,
  functionType,
  generalize,
  instantiate,
  nullType,
  numberType,
  objectType,
  stringType,
  Substitution,
  Type,
  TypeEnv,
  TypeScheme,
  typesEqual,
  typeToString,
  TypeVar,
  undefinedType,
  unitType,
} from "./types.ts";

import { builtinFunctions } from "./builtins.ts";

import {
  ArrayExpression,
  BinaryExpression,
  BlockExpression,
  BooleanLiteral,
  CallExpression,
  Expression,
  FunctionExpression,
  Identifier,
  IfExpression,
  IndexExpression,
  MatchExpression,
  MemberExpression,
  NullLiteral,
  NumberLiteral,
  ObjectExpression,
  Program,
  StringLiteral,
  UnaryExpression,
  UndefinedLiteral,
  VariableDeclaration,
} from "./ast.ts";

export class TypeError extends Error {
  constructor(message: string, public expression?: Expression) {
    super(message);
    this.name = "TypeError";
  }
}

export class TypeInferrer {
  private constraints: Constraint[] = [];

  constructor() {}

  // Main inference entry point
  infer(program: Program): TypeEnv {
    const env = this.createInitialEnv();

    for (const expr of program.body) {
      const type = this.inferExpression(expr, env);

      // Solve constraints after each expression
      const substitution = this.solveConstraints();

      // Apply substitution to environment
      this.applySubstitutionToEnv(env, substitution);

      // Apply substitution to the inferred type if it's a variable declaration
      if (expr.kind === "VariableDeclaration") {
        const scheme = env.get(expr.identifier.name);
        if (scheme) {
          const solvedType = applySubstitution(substitution, scheme.type);
          env.set(expr.identifier.name, { ...scheme, type: solvedType });
        }
      }
    }

    return env;
  }

  // Infer type of an expression
  inferExpression(expr: Expression, env: TypeEnv): Type {
    switch (expr.kind) {
      case "NumberLiteral":
        return this.inferNumberLiteral(expr);

      case "StringLiteral":
        return this.inferStringLiteral(expr);

      case "BooleanLiteral":
        return this.inferBooleanLiteral(expr);

      case "NullLiteral":
        return this.inferNullLiteral(expr);

      case "UndefinedLiteral":
        return this.inferUndefinedLiteral(expr);

      case "Identifier":
        return this.inferIdentifier(expr, env);

      case "ArrayExpression":
        return this.inferArrayExpression(expr, env);

      case "ObjectExpression":
        return this.inferObjectExpression(expr, env);

      case "FunctionExpression":
        return this.inferFunctionExpression(expr, env);

      case "CallExpression":
        return this.inferCallExpression(expr, env);

      case "BinaryExpression":
        return this.inferBinaryExpression(expr, env);

      case "UnaryExpression":
        return this.inferUnaryExpression(expr, env);

      case "IfExpression":
        return this.inferIfExpression(expr, env);

      case "BlockExpression":
        return this.inferBlockExpression(expr, env);

      case "VariableDeclaration":
        return this.inferVariableDeclaration(expr, env);

      case "MemberExpression":
        return this.inferMemberExpression(expr, env);

      case "IndexExpression":
        return this.inferIndexExpression(expr, env);

      case "MatchExpression":
        return this.inferMatchExpression(expr, env);

      default:
        throw new TypeError(`Unknown expression kind: ${(expr as any).kind}`, expr);
    }
  }

  private inferNumberLiteral(expr: NumberLiteral): Type {
    return numberType();
  }

  private inferStringLiteral(expr: StringLiteral): Type {
    return stringType();
  }

  private inferBooleanLiteral(expr: BooleanLiteral): Type {
    return booleanType();
  }

  private inferNullLiteral(expr: NullLiteral): Type {
    return nullType();
  }

  private inferUndefinedLiteral(expr: UndefinedLiteral): Type {
    return undefinedType();
  }

  private inferIdentifier(expr: Identifier, env: TypeEnv): Type {
    const scheme = env.get(expr.name);
    if (!scheme) {
      throw new TypeError(`Undefined variable: ${expr.name}`, expr);
    }
    return instantiate(scheme);
  }

  private inferArrayExpression(expr: ArrayExpression, env: TypeEnv): Type {
    if (expr.elements.length === 0) {
      // Empty array gets a fresh type variable
      return arrayType(freshTypeVar("T"));
    }

    // Infer type of first element
    const firstType = this.inferExpression(expr.elements[0], env);

    // All elements must have the same type
    for (let i = 1; i < expr.elements.length; i++) {
      const elemType = this.inferExpression(expr.elements[i], env);
      this.addConstraint(firstType, elemType);
    }

    return arrayType(firstType);
  }

  private inferObjectExpression(expr: ObjectExpression, env: TypeEnv): Type {
    const fields = new Map<string, Type>();

    for (const prop of expr.properties) {
      const valueType = this.inferExpression(prop.value, env);
      fields.set(prop.key, valueType);
    }

    return objectType(fields);
  }

  private inferFunctionExpression(expr: FunctionExpression, env: TypeEnv): Type {
    // Create new environment with parameter types
    const newEnv = new Map(env);
    const paramTypes: Type[] = [];

    for (const param of expr.parameters) {
      let paramType: Type;

      // If parameter has type annotation, use it
      if (param.typeAnnotation) {
        paramType = this.typeExpressionToType(param.typeAnnotation.type);
      } else {
        // Otherwise create fresh type variable
        paramType = freshTypeVar(param.identifier.name);
      }

      paramTypes.push(paramType);
      newEnv.set(param.identifier.name, { typeVars: [], type: paramType });
    }

    // Infer body type
    const bodyType = this.inferExpression(expr.body, newEnv);

    // If function has return type annotation, check it
    if (expr.returnTypeAnnotation) {
      const declaredReturnType = this.typeExpressionToType(expr.returnTypeAnnotation.type);
      this.addConstraint(bodyType, declaredReturnType);
    }

    return functionType(paramTypes, bodyType);
  }

  private typeExpressionToType(typeExpr: any): Type {
    switch (typeExpr.kind) {
      case "PrimitiveTypeExpression":
        switch (typeExpr.primitive) {
          case "number":
            return numberType();
          case "string":
            return stringType();
          case "boolean":
            return booleanType();
          case "null":
            return nullType();
          case "undefined":
            return undefinedType();
          case "unit":
            return unitType();
          default:
            throw new TypeError(`Unknown primitive type: ${typeExpr.primitive}`);
        }

      case "ArrayTypeExpression":
        const elementType = this.typeExpressionToType(typeExpr.elementType);
        return arrayType(elementType);

      case "FunctionTypeExpression":
        const paramTypes = typeExpr.paramTypes.map((pt: any) => this.typeExpressionToType(pt));
        const returnType = this.typeExpressionToType(typeExpr.returnType);
        return functionType(paramTypes, returnType);

      case "TypeVariable":
        return freshTypeVar(typeExpr.name);

      default:
        throw new TypeError(`Unsupported type expression: ${typeExpr.kind}`);
    }
  }

  private inferCallExpression(expr: CallExpression, env: TypeEnv): Type {
    const funcType = this.inferExpression(expr.callee, env);
    const argTypes = expr.arguments.map((arg) => this.inferExpression(arg, env));
    const returnType = freshTypeVar("R");

    // Function type should be: (argTypes) => returnType
    const expectedFuncType = functionType(argTypes, returnType);
    this.addConstraint(funcType, expectedFuncType);

    return returnType;
  }

  private inferBinaryExpression(expr: BinaryExpression, env: TypeEnv): Type {
    const leftType = this.inferExpression(expr.left, env);
    const rightType = this.inferExpression(expr.right, env);

    switch (expr.operator) {
      case "+":
      case "-":
      case "*":
      case "/":
      case "%":
        // Arithmetic operations: number -> number -> number
        this.addConstraint(leftType, numberType());
        this.addConstraint(rightType, numberType());
        return numberType();

      case "==":
      case "!=":
        // Equality: T -> T -> boolean
        this.addConstraint(leftType, rightType);
        return booleanType();

      case "<":
      case "<=":
      case ">":
      case ">=":
        // Comparison: number -> number -> boolean
        this.addConstraint(leftType, numberType());
        this.addConstraint(rightType, numberType());
        return booleanType();

      case "&&":
      case "||":
        // Logical operations: boolean -> boolean -> boolean
        this.addConstraint(leftType, booleanType());
        this.addConstraint(rightType, booleanType());
        return booleanType();

      default:
        throw new TypeError(`Unknown binary operator: ${expr.operator}`, expr);
    }
  }

  private inferUnaryExpression(expr: UnaryExpression, env: TypeEnv): Type {
    const operandType = this.inferExpression(expr.operand, env);

    switch (expr.operator) {
      case "!":
        // Logical not: boolean -> boolean
        this.addConstraint(operandType, booleanType());
        return booleanType();

      case "-":
        // Numeric negation: number -> number
        this.addConstraint(operandType, numberType());
        return numberType();

      default:
        throw new TypeError(`Unknown unary operator: ${expr.operator}`, expr);
    }
  }

  private inferIfExpression(expr: IfExpression, env: TypeEnv): Type {
    const condType = this.inferExpression(expr.condition, env);
    this.addConstraint(condType, booleanType());

    const thenType = this.inferExpression(expr.thenBranch, env);

    if (expr.elseBranch) {
      const elseType = this.inferExpression(expr.elseBranch, env);
      this.addConstraint(thenType, elseType);
      return thenType;
    } else {
      // If without else returns unit if condition is false
      this.addConstraint(thenType, unitType());
      return unitType();
    }
  }

  private inferBlockExpression(expr: BlockExpression, env: TypeEnv): Type {
    const newEnv = new Map(env);

    // Process statements
    for (const stmt of expr.statements) {
      if (stmt.kind === "LetStatement") {
        const valueType = this.inferExpression(stmt.initializer, newEnv);
        const scheme = generalize(newEnv, valueType);
        newEnv.set(stmt.identifier.name, scheme);
      } else if (stmt.kind === "ExpressionStatement") {
        this.inferExpression(stmt.expression, newEnv);
      }
    }

    // Return type is the type of the final expression
    return this.inferExpression(expr.expression, newEnv);
  }

  private inferVariableDeclaration(expr: VariableDeclaration, env: TypeEnv): Type {
    // Special handling for recursive functions
    if (expr.initializer.kind === "FunctionExpression") {
      // Pre-declare the function with a fresh type variable
      const funcType = freshTypeVar();
      const tempScheme = { type: funcType, typeVars: [] };
      env.set(expr.identifier.name, tempScheme);

      // Now infer the function type with the function itself in scope
      const actualType = this.inferExpression(expr.initializer, env);

      // Unify the assumed type with the actual type
      this.addConstraint(funcType, actualType);

      // Update the environment with the correct scheme
      const scheme = generalize(env, actualType);
      env.set(expr.identifier.name, scheme);
      return actualType;
    } else {
      // Regular variable declaration
      const valueType = this.inferExpression(expr.initializer, env);
      const scheme = generalize(env, valueType);
      env.set(expr.identifier.name, scheme);
      return valueType;
    }
  }

  private inferMemberExpression(expr: MemberExpression, env: TypeEnv): Type {
    const objType = this.inferExpression(expr.object, env);
    const propertyType = freshTypeVar("P");

    // Object should have the property with the inferred type
    const expectedObjectType = objectType(
      new Map([[expr.property, propertyType]]),
    );

    this.addConstraint(objType, expectedObjectType);
    return propertyType;
  }

  private inferIndexExpression(expr: IndexExpression, env: TypeEnv): Type {
    const arrType = this.inferExpression(expr.array, env);
    const indexType = this.inferExpression(expr.index, env);

    // Index should be a number
    this.addConstraint(indexType, numberType());

    // Array should be [T] for some T
    const elementType = freshTypeVar("T");
    const expectedArrayType = arrayType(elementType);
    this.addConstraint(arrType, expectedArrayType);

    return elementType;
  }

  private inferMatchExpression(expr: MatchExpression, env: TypeEnv): Type {
    const exprType = this.inferExpression(expr.expression, env);

    if (expr.cases.length === 0) {
      throw new TypeError("Match expression must have at least one case", expr);
    }

    // All cases must return the same type
    const firstCaseType = this.inferMatchCase(expr.cases[0], exprType, env);

    for (let i = 1; i < expr.cases.length; i++) {
      const caseType = this.inferMatchCase(expr.cases[i], exprType, env);
      this.addConstraint(firstCaseType, caseType);
    }

    return firstCaseType;
  }

  private inferMatchCase(matchCase: any, exprType: Type, env: TypeEnv): Type {
    const newEnv = new Map(env);

    // Handle pattern and add bindings to environment
    this.inferPattern(matchCase.pattern, exprType, newEnv);

    // Check guard condition if present
    if (matchCase.guard) {
      const guardType = this.inferExpression(matchCase.guard, newEnv);
      this.addConstraint(guardType, booleanType());
    }

    // Infer body type
    return this.inferExpression(matchCase.body, newEnv);
  }

  private inferPattern(pattern: any, type: Type, env: TypeEnv): void {
    switch (pattern.kind) {
      case "LiteralPattern":
        const literalType = this.inferExpression(pattern.value, env);
        this.addConstraint(type, literalType);
        break;

      case "IdentifierPattern":
        const scheme = generalize(env, type);
        env.set(pattern.identifier.name, scheme);
        break;

      case "WildcardPattern":
        // Wildcard matches anything, no constraints
        break;

      default:
        throw new TypeError(`Unknown pattern kind: ${pattern.kind}`);
    }
  }

  private addConstraint(type1: Type, type2: Type): void {
    this.constraints.push({ left: type1, right: type2 });
  }

  // Solve constraints using unification
  solveConstraints(): Substitution {
    let substitution = new Map<number, Type>();

    for (const constraint of this.constraints) {
      const mgu = this.unify(
        applySubstitution(substitution, constraint.left),
        applySubstitution(substitution, constraint.right),
      );
      substitution = composeSubstitutions(mgu, substitution);
    }

    this.constraints = []; // Clear constraints after solving
    return substitution;
  }

  // Unification algorithm (Most General Unifier)
  private unify(type1: Type, type2: Type): Substitution {
    if (typesEqual(type1, type2)) {
      return new Map();
    }

    if (type1.kind === "TypeVar") {
      return this.unifyVariable(type1, type2);
    }

    if (type2.kind === "TypeVar") {
      return this.unifyVariable(type2, type1);
    }

    if (type1.kind === "FunctionType" && type2.kind === "FunctionType") {
      return this.unifyFunction(type1, type2);
    }

    if (type1.kind === "ArrayType" && type2.kind === "ArrayType") {
      return this.unify(type1.elementType, type2.elementType);
    }

    if (type1.kind === "ObjectType" && type2.kind === "ObjectType") {
      return this.unifyObject(type1, type2);
    }

    throw new TypeError(
      `Cannot unify types: ${typeToString(type1)} and ${typeToString(type2)}`,
    );
  }

  private unifyVariable(typeVar: TypeVar, type: Type): Substitution {
    if (type.kind === "TypeVar" && typeVar.id === type.id) {
      return new Map();
    }

    if (this.occursCheck(typeVar.id, type)) {
      throw new TypeError(
        `Occurs check failed: ${typeToString(typeVar)} occurs in ${typeToString(type)}`,
      );
    }

    return new Map([[typeVar.id, type]]);
  }

  private unifyFunction(func1: any, func2: any): Substitution {
    if (func1.paramTypes.length !== func2.paramTypes.length) {
      throw new TypeError(
        `Function arity mismatch: ${func1.paramTypes.length} vs ${func2.paramTypes.length}`,
      );
    }

    let substitution = new Map<number, Type>();

    // Unify parameter types
    for (let i = 0; i < func1.paramTypes.length; i++) {
      const mgu = this.unify(
        applySubstitution(substitution, func1.paramTypes[i]),
        applySubstitution(substitution, func2.paramTypes[i]),
      );
      substitution = composeSubstitutions(mgu, substitution);
    }

    // Unify return types
    const returnMgu = this.unify(
      applySubstitution(substitution, func1.returnType),
      applySubstitution(substitution, func2.returnType),
    );

    return composeSubstitutions(returnMgu, substitution);
  }

  private unifyObject(obj1: any, obj2: any): Substitution {
    let substitution = new Map<number, Type>();

    // For structural subtyping, we try both directions:
    // 1. obj1 is a subtype of obj2 (obj1 has all fields of obj2, maybe more)
    // 2. obj2 is a subtype of obj1 (obj2 has all fields of obj1, maybe more)

    // First try: obj1 ⊆ obj2 (obj2 has all fields that obj1 requires)
    const canUnifyAsSubtype = this.tryUnifyObjectAsSubtype(obj1, obj2);
    if (canUnifyAsSubtype) {
      return canUnifyAsSubtype;
    }

    // Second try: obj2 ⊆ obj1 (obj1 has all fields that obj2 requires)
    const canUnifyAsSuper = this.tryUnifyObjectAsSubtype(obj2, obj1);
    if (canUnifyAsSuper) {
      return canUnifyAsSuper;
    }

    // Find missing fields for better error message
    const obj1Fields = new Set(obj1.fields.keys());
    const obj2Fields = new Set(obj2.fields.keys());

    const missingInObj1 = Array.from(obj2Fields).filter((f) => !obj1Fields.has(f));
    const missingInObj2 = Array.from(obj1Fields).filter((f) => !obj2Fields.has(f));

    let errorMsg = `Object types are incompatible: ${this.objectFieldsToString(obj1)} and ${
      this.objectFieldsToString(obj2)
    }`;

    if (missingInObj1.length > 0) {
      errorMsg += `. Missing field(s) in first object: ${missingInObj1.join(", ")}`;
    }
    if (missingInObj2.length > 0) {
      errorMsg += `. Missing field(s) in second object: ${missingInObj2.join(", ")}`;
    }

    throw new TypeError(errorMsg);
  }

  private tryUnifyObjectAsSubtype(subtype: any, supertype: any): Substitution | null {
    try {
      let substitution = new Map<number, Type>();

      // Check that all required fields in supertype are present in subtype
      for (const [key, supertypeFieldType] of supertype.fields) {
        const subtypeFieldType = subtype.fields.get(key);
        if (!subtypeFieldType) {
          return null; // Missing required field
        }

        const mgu = this.unify(
          applySubstitution(substitution, subtypeFieldType),
          applySubstitution(substitution, supertypeFieldType),
        );
        substitution = composeSubstitutions(mgu, substitution);
      }

      // Subtype can have extra fields - this is allowed in structural subtyping
      return substitution;
    } catch (error) {
      return null; // Unification failed
    }
  }

  private objectFieldsToString(obj: any): string {
    const entries = Array.from(obj.fields.entries()) as [any, any][];
    const fields = entries
      .map(([key, type]) => `${key}: ${typeToString(type)}`)
      .join(", ");
    return `{ ${fields} }`;
  }

  private occursCheck(varId: number, type: Type): boolean {
    return freeTypeVars(type).has(varId);
  }

  createInitialEnv(): TypeEnv {
    const env = new Map<string, TypeScheme>();

    // Add built-in functions to initial environment
    for (const [name, builtin] of builtinFunctions) {
      env.set(name, builtin.typeScheme);
    }

    return env;
  }

  // Helper to apply substitution to environment
  private applySubstitutionToEnv(env: TypeEnv, substitution: Substitution): void {
    for (const [name, scheme] of env) {
      const solvedType = applySubstitution(substitution, scheme.type);
      env.set(name, { ...scheme, type: solvedType });
    }
  }

  // Public method to infer and solve
  inferAndSolve(program: Program): TypeEnv {
    return this.infer(program);
  }
}
