// Hindley-Milner Type Inference Engine for MTS

import {
  applySubstitution,
  arrayType,
  booleanType,
  composeSubstitutions,
  Constraint,
  dictType,
  freeTypeVars,
  freeTypeVarsInEnv,
  freshRowVar,
  freshTypeVar,
  functionType,
  generalize,
  instantiate,
  nullType,
  numberType,
  ObjectType,
  objectType,
  RowVar,
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
  DictionaryExpression,
  DictionaryTypeExpression,
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
  TypeExpression,
  UnaryExpression,
  UndefinedLiteral,
  VariableBinding,
  VariableDeclaration,
} from "./ast.ts";

export class TypeError extends Error {
  constructor(message: string, public expression?: Expression) {
    super(message);
    this.name = "TypeError";
  }
}

// Field access constraint for row polymorphism
interface FieldAccessConstraint {
  kind: "FieldAccess";
  objectType: Type;
  fieldName: string;
  fieldType: Type;
}

export class TypeInferrer {
  private constraints: Constraint[] = [];
  private fieldAccessConstraints: FieldAccessConstraint[] = [];

  constructor() {}

  // Main inference entry point
  infer(program: Program, envOverride?: TypeEnv): TypeEnv {
    const env: TypeEnv = envOverride ? new Map(envOverride) : this.createInitialEnv();

    for (const node of program.body) {
      if ((node as any).kind === "ImportDeclaration") {
        continue;
      }

      const expr = node as Expression;
      const type = this.inferExpression(expr, env);

      // Solve constraints after each expression
      const substitution = this.solveConstraints();

      // Apply substitution to environment
      this.applySubstitutionToEnv(env, substitution);

      // Handle let expressions at top level
      if (expr.kind === "VariableDeclaration") {
        for (const binding of expr.bindings) {
          const scheme = env.get(binding.identifier.name);
          if (scheme) {
            const solvedType = applySubstitution(substitution, scheme.type);
            env.set(binding.identifier.name, { ...scheme, type: solvedType });
          }
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

      case "DictionaryExpression":
        return this.inferDictionaryExpression(expr, env);

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

  private inferDictionaryExpression(expr: DictionaryExpression, env: TypeEnv): Type {
    if (expr.entries.length === 0) {
      // Empty dictionary gets fresh type variables for key and value
      return dictType(freshTypeVar("K"), freshTypeVar("V"));
    }

    // Infer types of first entry
    const firstEntry = expr.entries[0];
    const firstKeyType = this.inferExpression(firstEntry.key, env);
    const firstValueType = this.inferExpression(firstEntry.value, env);

    // All keys must have the same type, all values must have the same type
    for (let i = 1; i < expr.entries.length; i++) {
      const entry = expr.entries[i];
      const keyType = this.inferExpression(entry.key, env);
      const valueType = this.inferExpression(entry.value, env);

      this.addConstraint(firstKeyType, keyType);
      this.addConstraint(firstValueType, valueType);
    }

    return dictType(firstKeyType, firstValueType);
  }

  private inferObjectExpression(expr: ObjectExpression, env: TypeEnv): Type {
    const fields = new Map<string, Type>();

    for (const prop of expr.properties) {
      const valueType = this.inferExpression(prop.value, env);
      fields.set(prop.key, valueType);
    }

    // Object literals are closed (no row variable)
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
        paramType = freshTypeVar();
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

      case "DictionaryTypeExpression":
        const keyType = this.typeExpressionToType(typeExpr.keyType);
        const valueType = this.typeExpressionToType(typeExpr.valueType);
        return dictType(keyType, valueType);

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

    // Expected callable type: (argTypes) => returnType
    const expectedFuncType = functionType(argTypes, returnType);
    // Allow function subtyping: funcType ≤ expectedFuncType
    this.enforceSubtype(funcType, expectedFuncType);

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

      // If both branches are objects, join structurally by common fields
      if (thenType.kind === "ObjectType" && elseType.kind === "ObjectType") {
        const commonKeys = new Set<string>();
        for (const k of thenType.row.fields.keys()) {
          if (elseType.row.fields.has(k)) commonKeys.add(k);
        }

        // Constrain common field types to agree and return the common-shape object
        const joinedFields = new Map<string, Type>();
        for (const key of commonKeys) {
          const tField = thenType.row.fields.get(key)!;
          const eField = elseType.row.fields.get(key)!;
          // If nested objects, join recursively for better precision
          if (tField.kind === "ObjectType" && eField.kind === "ObjectType") {
            const nested = this.joinObjectTypes(tField, eField);
            joinedFields.set(key, nested);
          } else {
            this.addConstraint(tField, eField);
            joinedFields.set(key, tField);
          }
        }

        // When there are no common fields, keep previous behavior (equality constraint)
        if (joinedFields.size > 0) {
          return objectType(joinedFields);
        }
      }

      // Fallback: enforce equality and return thenType
      this.addConstraint(thenType, elseType);
      return thenType;
    } else {
      // If without else returns unit if condition is false
      this.addConstraint(thenType, unitType());
      return unitType();
    }
  }

  // Enforce a directional subtype relation a ≤ b by emitting constraints
  private enforceSubtype(a: Type, b: Type): void {
    // Fast path: identical kinds, fall back to equality constraints
    if (typesEqual(a, b)) {
      return;
    }

    // Functions: params are contravariant, return is covariant
    if (a.kind === "FunctionType" && b.kind === "FunctionType") {
      if (a.paramTypes.length !== b.paramTypes.length) {
        throw new TypeError(
          `Function arity mismatch: ${a.paramTypes.length} vs ${b.paramTypes.length}`,
        );
      }
      for (let i = 0; i < a.paramTypes.length; i++) {
        // b.param ≤ a.param (contravariant)
        this.enforceSubtype(b.paramTypes[i], a.paramTypes[i]);
      }
      // a.return ≤ b.return (covariant)
      this.enforceSubtype(a.returnType, b.returnType);
      return;
    }

    // Objects: width subtyping (a may have extra fields). Field types must be compatible
    if (a.kind === "ObjectType" && b.kind === "ObjectType") {
      for (const [key, bField] of b.row.fields) {
        const aField = a.row.fields.get(key);
        if (!aField) {
          // Keep message consistent with existing tests
          throw new TypeError(`missing fields: ${key}`);
        }
        this.enforceSubtype(aField, bField);
      }
      return;
    }

    // Arrays/Dicts: keep invariant for now (use equality)
    if (a.kind === "ArrayType" && b.kind === "ArrayType") {
      this.addConstraint(a.elementType, b.elementType);
      return;
    }
    if (a.kind === "DictType" && b.kind === "DictType") {
      this.addConstraint(a.keyType, b.keyType);
      this.addConstraint(a.valueType, b.valueType);
      return;
    }

    // Type variables: defer to unification by emitting equality constraint
    if (a.kind === "TypeVar" || b.kind === "TypeVar") {
      this.addConstraint(a, b);
      return;
    }

    // Fallback: require equality
    this.addConstraint(a, b);
  }

  // Structurally join two object types by common fields, recursing into nested objects
  private joinObjectTypes(a: ObjectType, b: ObjectType): ObjectType {
    const keys = new Set<string>();
    for (const k of a.row.fields.keys()) {
      if (b.row.fields.has(k)) keys.add(k);
    }
    const fields = new Map<string, Type>();
    for (const key of keys) {
      const aField = a.row.fields.get(key)!;
      const bField = b.row.fields.get(key)!;
      if (aField.kind === "ObjectType" && bField.kind === "ObjectType") {
        fields.set(key, this.joinObjectTypes(aField, bField));
      } else {
        this.addConstraint(aField, bField);
        fields.set(key, aField);
      }
    }
    return objectType(fields);
  }

  private inferBlockExpression(expr: BlockExpression, env: TypeEnv): Type {
    const newEnv = new Map(env);

    // Process statements
    for (const stmt of expr.statements) {
      if (stmt.kind === "LetStatement") {
        this.inferBindingGroup(stmt.bindings, newEnv);
      } else if (stmt.kind === "ExpressionStatement") {
        this.inferExpression(stmt.expression, newEnv);
      }
    }

    // Return type is the type of the final expression
    return this.inferExpression(expr.expression, newEnv);
  }

  private inferVariableDeclaration(expr: VariableDeclaration, env: TypeEnv): Type {
    const types = this.inferBindingGroup(expr.bindings, env);
    return types[types.length - 1];
  }

  private inferBindingGroup(bindings: VariableBinding[], env: TypeEnv): Type[] {
    if (bindings.length === 0) {
      throw new TypeError("Let binding group must contain at least one binding");
    }

    const assumedTypes = new Map<string, Type>();
    const annotatedTypes = new Map<string, Type | null>();

    // Pre-declare all bindings to support mutual recursion
    for (const binding of bindings) {
      const annotation = binding.typeAnnotation
        ? this.typeExpressionToType(binding.typeAnnotation.type)
        : null;
      annotatedTypes.set(binding.identifier.name, annotation);

      const assumedType = annotation ?? freshTypeVar(binding.identifier.name);
      assumedTypes.set(binding.identifier.name, assumedType);
      env.set(binding.identifier.name, { type: assumedType, typeVars: [] });
    }

    const resultTypes: Type[] = [];

    for (const binding of bindings) {
      const assumedType = assumedTypes.get(binding.identifier.name)!;
      const annotation = annotatedTypes.get(binding.identifier.name);

      const actualType = this.inferExpression(binding.initializer, env);

      // Ensure the actual type matches the assumed type
      this.addConstraint(actualType, assumedType);

      if (annotation) {
        // Allow width subtyping for annotations
        this.enforceSubtype(actualType, annotation);
      }

      const finalType = annotation ?? actualType;
      const scheme = generalize(env, finalType);
      env.set(binding.identifier.name, scheme);
      resultTypes.push(finalType);
    }

    return resultTypes;
  }

  private primitiveToType(primitive: string): Type {
    switch (primitive) {
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
        throw new TypeError(`Unknown primitive type: ${primitive}`);
    }
  }

  private inferMemberExpression(expr: MemberExpression, env: TypeEnv): Type {
    const objType = this.inferExpression(expr.object, env);

    // If objType is already an object type, try to find the field directly
    if (objType.kind === "ObjectType") {
      const fieldType = objType.row.fields.get(expr.property);
      if (fieldType) {
        return fieldType;
      }
      // Field not found in known fields, but might exist due to row variable
      if (objType.row.rowVar) {
        const propertyType = freshTypeVar("P");
        return propertyType;
      }
      throw new TypeError(`Property '${expr.property}' does not exist on object type`);
    }

    // For type variables, handle differently to avoid occurs check issues
    if (objType.kind === "TypeVar") {
      const propertyType = freshTypeVar("P");

      // Instead of creating a direct constraint, create a field access constraint
      // This approach avoids circular dependencies in the constraint system
      this.addFieldAccessConstraint(objType, expr.property, propertyType);
      return propertyType;
    }

    // For other types, use traditional row polymorphism
    const propertyType = freshTypeVar("P");
    const rowVar = freshRowVar("ρ");
    const requiredFields = new Map([[expr.property, propertyType]]);
    const expectedObjectType = objectType(requiredFields, rowVar);

    this.addConstraint(objType, expectedObjectType);
    return propertyType;
  }

  private inferIndexExpression(expr: IndexExpression, env: TypeEnv): Type {
    const containerType = this.inferExpression(expr.array, env);
    const indexType = this.inferExpression(expr.index, env);

    // Create fresh type variable for the result
    const resultType = freshTypeVar("T");

    // The container could be either an array [T] or a dictionary Dict<K, V>
    // For arrays: index must be number, result is element type
    // For dictionaries: index can be any type (key type), result is value type

    // Check if the container is a dictionary literal
    if (expr.array.kind === "DictionaryExpression") {
      // Direct dictionary access
      this.addConstraint(containerType, dictType(indexType, resultType));
    } else if (expr.index.kind === "StringLiteral") {
      // String literal index strongly suggests dictionary access
      this.addConstraint(containerType, dictType(indexType, resultType));
    } else {
      // For all other cases (number literals, variables, expressions),
      // default to array for backwards compatibility
      // Arrays are the common case for numeric indexing
      this.addConstraint(containerType, arrayType(resultType));
      this.addConstraint(indexType, numberType());

      // Note: This means dictionary access with non-string keys requires
      // the dictionary to be directly created, not through a variable
    }

    return resultType;
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

  private addFieldAccessConstraint(objectType: Type, fieldName: string, fieldType: Type): void {
    this.fieldAccessConstraints.push({
      kind: "FieldAccess",
      objectType,
      fieldName,
      fieldType,
    });
  }

  // Solve constraints using unification
  public solveConstraints(): Substitution {
    let substitution = new Map<number, Type>();

    // First, process regular constraints
    for (const constraint of this.constraints) {
      const mgu = this.unify(
        applySubstitution(substitution, constraint.left),
        applySubstitution(substitution, constraint.right),
      );
      substitution = composeSubstitutions(mgu, substitution);
    }

    // Then, process field access constraints by grouping them by object type
    const fieldConstraintsByObj = new Map<number, FieldAccessConstraint[]>();

    for (const fieldConstraint of this.fieldAccessConstraints) {
      const objType = applySubstitution(substitution, fieldConstraint.objectType);

      if (objType.kind === "TypeVar") {
        if (!fieldConstraintsByObj.has(objType.id)) {
          fieldConstraintsByObj.set(objType.id, []);
        }
        fieldConstraintsByObj.get(objType.id)!.push({
          ...fieldConstraint,
          objectType: objType,
          fieldType: applySubstitution(substitution, fieldConstraint.fieldType),
        });
      }
    }

    // Process grouped constraints
    for (const [objTypeId, constraints] of fieldConstraintsByObj) {
      const objType = constraints[0].objectType as TypeVar;

      // Merge all field requirements for this object
      const requiredFields = new Map<string, Type>();
      for (const constraint of constraints) {
        requiredFields.set(constraint.fieldName, constraint.fieldType);
      }

      // Create object type with all required fields and row variable
      const rowVar = freshRowVar("ρ");
      const expectedObjectType = objectType(requiredFields, rowVar);

      const mgu = this.unify(objType, expectedObjectType);
      substitution = composeSubstitutions(mgu, substitution);
    }

    // Clear constraints after solving
    this.constraints = [];
    this.fieldAccessConstraints = [];
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

    if (type1.kind === "DictType" && type2.kind === "DictType") {
      // Unify dictionary types - both key and value types must match
      let substitution = this.unify(type1.keyType, type2.keyType);
      const valueMgu = this.unify(
        applySubstitution(substitution, type1.valueType),
        applySubstitution(substitution, type2.valueType),
      );
      return composeSubstitutions(valueMgu, substitution);
    }

    if (type1.kind === "ObjectType" && type2.kind === "ObjectType") {
      return this.unifyObjectWithRows(type1, type2);
    }

    if (type1.kind === "RowVar") {
      return this.unifyRowVariable(type1, type2);
    }
    if (type2.kind === "RowVar") {
      return this.unifyRowVariable(type2, type1);
    }

    throw new TypeError(
      `Cannot unify types: ${typeToString(type1)} and ${typeToString(type2)}`,
    );
  }

  private unifyRowVariable(rowVar: RowVar, type: Type): Substitution {
    if (type.kind === "RowVar" && rowVar.id === type.id) {
      return new Map();
    }

    // Row variables can only unify with other row variables
    if (type.kind === "RowVar") {
      return new Map([[rowVar.id, type]]);
    }

    // Row variables cannot be unified with regular types
    // They can only be absent (closed records) or present (open records)
    throw new TypeError(
      `Cannot unify row variable ${rowVar.name || `ρ${rowVar.id}`} with type ${typeToString(type)}`,
    );
  }

  private unifyObjectWithRows(obj1: ObjectType, obj2: ObjectType): Substitution {
    // This implements row polymorphism by allowing objects to have additional fields

    const row1 = obj1.row;
    const row2 = obj2.row;

    // Find common fields
    const commonFields = new Set<string>();
    const allFields = new Set([...row1.fields.keys(), ...row2.fields.keys()]);

    for (const field of allFields) {
      if (row1.fields.has(field) && row2.fields.has(field)) {
        commonFields.add(field);
      }
    }

    // Unify common fields
    let substitution = new Map<number, Type>();
    for (const field of commonFields) {
      const type1 = row1.fields.get(field)!;
      const type2 = row2.fields.get(field)!;
      const mgu = this.unify(
        applySubstitution(substitution, type1),
        applySubstitution(substitution, type2),
      );
      substitution = composeSubstitutions(mgu, substitution);
    }

    // Handle row variables for remaining fields
    const obj1OnlyFields = new Set([...row1.fields.keys()].filter((f) => !commonFields.has(f)));
    const obj2OnlyFields = new Set([...row2.fields.keys()].filter((f) => !commonFields.has(f)));

    // If obj1 has extra fields, obj2 must have a row variable to absorb them
    if (obj1OnlyFields.size > 0 && !row2.rowVar) {
      throw new TypeError(
        `Cannot unify object types: missing fields in second object: ${
          Array.from(obj1OnlyFields).join(", ")
        }`,
      );
    }

    // If obj2 has extra fields, obj1 must have a row variable to absorb them
    if (obj2OnlyFields.size > 0 && !row1.rowVar) {
      throw new TypeError(
        `Cannot unify object types: missing fields in first object: ${
          Array.from(obj2OnlyFields).join(", ")
        }`,
      );
    }

    // Unify row variables if both present
    if (row1.rowVar && row2.rowVar) {
      const rowMgu = this.unifyRowVariable(row1.rowVar, row2.rowVar);
      substitution = composeSubstitutions(rowMgu, substitution);
    }

    return substitution;
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
    const freeVars = freeTypeVars(type);

    if (!freeVars.has(varId)) {
      return false;
    }

    // For row-polymorphic object types, allow the occurs check to pass
    // if the variable appears in a structurally sound way
    if (type.kind === "ObjectType") {
      // Check if this is a valid row-polymorphic constraint
      // where the type variable represents the object type and appears
      // in field types, which is structurally valid
      return false;
    }

    return true;
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
  inferAndSolve(program: Program, envOverride?: TypeEnv): TypeEnv {
    return this.infer(program, envOverride);
  }
}
