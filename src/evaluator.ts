// Evaluator for MTS - Executes AST nodes to compute values

import {
  ArrayExpression,
  ASTNode,
  BinaryExpression,
  BlockExpression,
  BooleanLiteral,
  CallExpression,
  Expression,
  FunctionExpression,
  Identifier,
  IfExpression,
  IndexExpression,
  LetStatement,
  MatchExpression,
  MemberExpression,
  NullLiteral,
  NumberLiteral,
  ObjectExpression,
  Program,
  Statement,
  StringLiteral,
  UnaryExpression,
  UndefinedLiteral,
  VariableDeclaration,
} from "./ast.ts";
import { BuiltinFunction, builtinFunctions } from "./builtins.ts";

// Runtime values
export type RuntimeValue =
  | number
  | string
  | boolean
  | null
  | undefined
  | RuntimeValue[]
  | { [key: string]: RuntimeValue }
  | RuntimeFunction;

export interface RuntimeFunction {
  kind: "function";
  parameters: string[];
  body: Expression;
  closure: Environment;
}

// Runtime environment for variable bindings
export class Environment {
  private bindings: Map<string, RuntimeValue> = new Map();
  private parent?: Environment;

  constructor(parent?: Environment) {
    this.parent = parent;
  }

  define(name: string, value: RuntimeValue): void {
    this.bindings.set(name, value);
  }

  get(name: string): RuntimeValue {
    const value = this.bindings.get(name);
    if (value !== undefined) {
      return value;
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  has(name: string): boolean {
    return this.bindings.has(name) || (this.parent?.has(name) ?? false);
  }

  extend(): Environment {
    return new Environment(this);
  }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

export class Evaluator {
  private globalEnv: Environment;

  constructor() {
    this.globalEnv = this.createGlobalEnvironment();
  }

  private createGlobalEnvironment(): Environment {
    const env = new Environment();

    // Add builtin functions to global environment
    for (const [name, builtin] of builtinFunctions) {
      env.define(name, this.createBuiltinFunction(builtin));
    }

    return env;
  }

  private createBuiltinFunction(builtin: BuiltinFunction): RuntimeFunction {
    // For builtins, we create a special function that calls the implementation
    return {
      kind: "function",
      parameters: [], // Builtins handle their own parameter validation
      body: { kind: "NumberLiteral", value: 0 } as Expression, // Dummy body
      closure: new Environment(),
      // Store the actual implementation
      implementation: builtin.implementation,
    } as any;
  }

  evaluate(program: Program): RuntimeValue {
    let result: RuntimeValue = null;

    for (const node of program.body) {
      if (node.kind === "VariableDeclaration") {
        this.evaluateVariableDeclaration(node, this.globalEnv);
      } else {
        result = this.evaluateExpression(node as Expression, this.globalEnv);
      }
    }

    return result;
  }

  private evaluateExpression(expr: Expression, env: Environment): RuntimeValue {
    switch (expr.kind) {
      case "NumberLiteral":
        return (expr as NumberLiteral).value;

      case "StringLiteral":
        return (expr as StringLiteral).value;

      case "BooleanLiteral":
        return (expr as BooleanLiteral).value;

      case "NullLiteral":
        return null;

      case "UndefinedLiteral":
        return undefined;

      case "Identifier":
        return this.evaluateIdentifier(expr as Identifier, env);

      case "BinaryExpression":
        return this.evaluateBinaryExpression(expr as BinaryExpression, env);

      case "UnaryExpression":
        return this.evaluateUnaryExpression(expr as UnaryExpression, env);

      case "CallExpression":
        return this.evaluateCallExpression(expr as CallExpression, env);

      case "ArrayExpression":
        return this.evaluateArrayExpression(expr as ArrayExpression, env);

      case "ObjectExpression":
        return this.evaluateObjectExpression(expr as ObjectExpression, env);

      case "MemberExpression":
        return this.evaluateMemberExpression(expr as MemberExpression, env);

      case "IndexExpression":
        return this.evaluateIndexExpression(expr as IndexExpression, env);

      case "FunctionExpression":
        return this.evaluateFunctionExpression(expr as FunctionExpression, env);

      case "IfExpression":
        return this.evaluateIfExpression(expr as IfExpression, env);

      case "BlockExpression":
        return this.evaluateBlockExpression(expr as BlockExpression, env);

      case "MatchExpression":
        return this.evaluateMatchExpression(expr as MatchExpression, env);

      default:
        throw new RuntimeError(`Unknown expression kind: ${(expr as any).kind}`);
    }
  }

  private evaluateIdentifier(expr: Identifier, env: Environment): RuntimeValue {
    try {
      return env.get(expr.name);
    } catch (error) {
      throw new RuntimeError(`Undefined variable: ${expr.name}`);
    }
  }

  private evaluateBinaryExpression(expr: BinaryExpression, env: Environment): RuntimeValue {
    const left = this.evaluateExpression(expr.left, env);
    const right = this.evaluateExpression(expr.right, env);

    switch (expr.operator) {
      // Arithmetic
      case "+":
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }
        if (typeof left === "string" || typeof right === "string") {
          return String(left) + String(right);
        }
        throw new RuntimeError(`Invalid operands for +: ${typeof left} and ${typeof right}`);

      case "-":
        this.assertNumbers(left, right, "-");
        return (left as number) - (right as number);

      case "*":
        this.assertNumbers(left, right, "*");
        return (left as number) * (right as number);

      case "/":
        this.assertNumbers(left, right, "/");
        if (right === 0) {
          throw new RuntimeError("Division by zero");
        }
        return (left as number) / (right as number);

      case "%":
        this.assertNumbers(left, right, "%");
        return (left as number) % (right as number);

      // Comparison
      case ">":
        this.assertNumbers(left, right, ">");
        return (left as number) > (right as number);

      case "<":
        this.assertNumbers(left, right, "<");
        return (left as number) < (right as number);

      case ">=":
        this.assertNumbers(left, right, ">=");
        return (left as number) >= (right as number);

      case "<=":
        this.assertNumbers(left, right, "<=");
        return (left as number) <= (right as number);

      case "==":
        return this.isEqual(left, right);

      case "!=":
        return !this.isEqual(left, right);

      // Logical
      case "&&":
        return this.isTruthy(left) && this.isTruthy(right);

      case "||":
        return this.isTruthy(left) || this.isTruthy(right);

      default:
        throw new RuntimeError(`Unknown binary operator: ${expr.operator}`);
    }
  }

  private evaluateUnaryExpression(expr: UnaryExpression, env: Environment): RuntimeValue {
    const operand = this.evaluateExpression(expr.operand, env);

    switch (expr.operator) {
      case "-":
        if (typeof operand !== "number") {
          throw new RuntimeError(`Invalid operand for unary -: ${typeof operand}`);
        }
        return -(operand as number);

      case "!":
        return !this.isTruthy(operand);

      default:
        throw new RuntimeError(`Unknown unary operator: ${expr.operator}`);
    }
  }

  private evaluateCallExpression(expr: CallExpression, env: Environment): RuntimeValue {
    const callee = this.evaluateExpression(expr.callee, env);

    if (!this.isFunction(callee)) {
      throw new RuntimeError("Cannot call non-function value");
    }

    const args = expr.arguments.map((arg) => this.evaluateExpression(arg, env));

    // Handle builtin functions
    if (callee && typeof callee === "object" && "implementation" in callee) {
      try {
        return (callee as any).implementation(...args);
      } catch (error) {
        throw new RuntimeError(
          `Builtin function error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Handle user-defined functions
    const func = callee as RuntimeFunction;

    if (args.length !== func.parameters.length) {
      throw new RuntimeError(
        `Function expects ${func.parameters.length} arguments, got ${args.length}`,
      );
    }

    // Create new environment for function execution
    const funcEnv = func.closure.extend();

    // Bind parameters to arguments
    for (let i = 0; i < func.parameters.length; i++) {
      funcEnv.define(func.parameters[i], args[i]);
    }

    return this.evaluateExpression(func.body, funcEnv);
  }

  private evaluateArrayExpression(expr: ArrayExpression, env: Environment): RuntimeValue {
    return expr.elements.map((element) => this.evaluateExpression(element, env));
  }

  private evaluateObjectExpression(expr: ObjectExpression, env: Environment): RuntimeValue {
    const obj: { [key: string]: RuntimeValue } = {};

    for (const prop of expr.properties) {
      obj[prop.key] = this.evaluateExpression(prop.value, env);
    }

    return obj;
  }

  private evaluateMemberExpression(expr: MemberExpression, env: Environment): RuntimeValue {
    const object = this.evaluateExpression(expr.object, env);

    if (object === null || object === undefined) {
      throw new RuntimeError("Cannot access property of null or undefined");
    }

    if (typeof object !== "object" || Array.isArray(object)) {
      throw new RuntimeError("Cannot access property of non-object");
    }

    const obj = object as { [key: string]: RuntimeValue };
    const value = obj[expr.property];

    if (value === undefined) {
      throw new RuntimeError(`Property '${expr.property}' does not exist`);
    }

    return value;
  }

  private evaluateIndexExpression(expr: IndexExpression, env: Environment): RuntimeValue {
    const array = this.evaluateExpression(expr.array, env);
    const index = this.evaluateExpression(expr.index, env);

    if (!Array.isArray(array)) {
      throw new RuntimeError("Cannot index non-array value");
    }

    if (typeof index !== "number") {
      throw new RuntimeError("Array index must be a number");
    }

    const idx = index as number;
    if (idx < 0 || idx >= array.length) {
      throw new RuntimeError(`Array index out of bounds: ${idx}`);
    }

    return array[idx];
  }

  private evaluateFunctionExpression(expr: FunctionExpression, env: Environment): RuntimeValue {
    return {
      kind: "function",
      parameters: expr.parameters.map((p) => p.identifier.name),
      body: expr.body,
      closure: env,
    };
  }

  private evaluateIfExpression(expr: IfExpression, env: Environment): RuntimeValue {
    const condition = this.evaluateExpression(expr.condition, env);

    if (this.isTruthy(condition)) {
      return this.evaluateExpression(expr.thenBranch, env);
    } else if (expr.elseBranch) {
      return this.evaluateExpression(expr.elseBranch, env);
    } else {
      return null; // Unit type
    }
  }

  private evaluateBlockExpression(expr: BlockExpression, env: Environment): RuntimeValue {
    const blockEnv = env.extend();

    // Execute statements
    for (const stmt of expr.statements) {
      this.evaluateStatement(stmt, blockEnv);
    }

    // Evaluate final expression
    return this.evaluateExpression(expr.expression, blockEnv);
  }

  private evaluateMatchExpression(expr: MatchExpression, env: Environment): RuntimeValue {
    const value = this.evaluateExpression(expr.expression, env);

    for (const matchCase of expr.cases) {
      if (this.matchesPattern(value, matchCase.pattern, env)) {
        return this.evaluateExpression(matchCase.body, env);
      }
    }

    throw new RuntimeError("No matching pattern in match expression");
  }

  private evaluateStatement(stmt: Statement, env: Environment): void {
    switch (stmt.kind) {
      case "LetStatement":
        this.evaluateLetStatement(stmt as LetStatement, env);
        break;

      default:
        throw new RuntimeError(`Unknown statement kind: ${(stmt as any).kind}`);
    }
  }

  private evaluateVariableDeclaration(decl: VariableDeclaration, env: Environment): void {
    const value = this.evaluateExpression(decl.initializer, env);
    env.define(decl.identifier.name, value);
  }

  private evaluateLetStatement(stmt: LetStatement, env: Environment): void {
    const value = this.evaluateExpression(stmt.initializer, env);
    env.define(stmt.identifier.name, value);
  }

  // Helper methods
  private assertNumbers(left: RuntimeValue, right: RuntimeValue, operator: string): void {
    if (typeof left !== "number" || typeof right !== "number") {
      throw new RuntimeError(`Operator ${operator} requires numeric operands`);
    }
  }

  private isEqual(left: RuntimeValue, right: RuntimeValue): boolean {
    if (typeof left !== typeof right) {
      return false;
    }

    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) {
        return false;
      }
      return left.every((val, index) => this.isEqual(val, right[index]));
    }

    if (typeof left === "object" && left !== null && right !== null) {
      const leftObj = left as { [key: string]: RuntimeValue };
      const rightObj = right as { [key: string]: RuntimeValue };
      const leftKeys = Object.keys(leftObj);
      const rightKeys = Object.keys(rightObj);

      if (leftKeys.length !== rightKeys.length) {
        return false;
      }

      return leftKeys.every((key) => this.isEqual(leftObj[key], rightObj[key]));
    }

    return left === right;
  }

  private isTruthy(value: RuntimeValue): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    if (typeof value === "string") {
      return value.length > 0;
    }
    return true;
  }

  private isFunction(value: RuntimeValue): boolean {
    return typeof value === "object" && value !== null && "kind" in value &&
      (value as any).kind === "function";
  }

  private matchesPattern(value: RuntimeValue, pattern: any, env: Environment): boolean {
    switch (pattern.kind) {
      case "LiteralPattern":
        return this.isEqual(value, this.evaluateExpression(pattern.value, env));

      case "IdentifierPattern":
        // Bind the value to the identifier in the environment
        env.define(pattern.identifier.name, value);
        return true;

      case "WildcardPattern":
        return true;

      default:
        throw new RuntimeError(`Unknown pattern kind: ${pattern.kind}`);
    }
  }
}
