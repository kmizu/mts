// Built-in Functions for MTS

import {
  ArrayType,
  BooleanType,
  FunctionType,
  NumberType,
  StringType,
  Type,
  TypeScheme,
  TypeVar,
  UnitType,
} from "./types.ts";

export interface BuiltinFunction {
  name: string;
  typeScheme: TypeScheme;
  implementation: (...args: any[]) => any;
  description: string;
}

// Helper functions to create type instances
function createNumberType(): NumberType {
  return { kind: "NumberType" };
}

function createStringType(): StringType {
  return { kind: "StringType" };
}

function createBooleanType(): BooleanType {
  return { kind: "BooleanType" };
}

function createUnitType(): UnitType {
  return { kind: "UnitType" };
}

function createArrayType(elementType: Type): ArrayType {
  return { kind: "ArrayType", elementType };
}

function createFunctionType(paramTypes: Type[], returnType: Type): FunctionType {
  return { kind: "FunctionType", paramTypes, returnType };
}

let typeVarCounter = 10000; // Start from a high number to avoid conflicts with types.ts
function createTypeVar(name?: string): TypeVar {
  return { kind: "TypeVar", id: typeVarCounter++, name };
}

// Type variables for polymorphic functions
const a = createTypeVar("a");
const b = createTypeVar("b");

export const builtinFunctions: Map<string, BuiltinFunction> = new Map([
  // === Array Functions ===
  [
    "length",
    {
      name: "length",
      typeScheme: {
        type: createFunctionType([createArrayType(a)], createNumberType()),
        typeVars: [a],
      },
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("length() expects an array");
        }
        return arr.length;
      },
      description: "Returns the length of an array",
    },
  ],

  [
    "head",
    {
      name: "head",
      typeScheme: {
        type: createFunctionType([createArrayType(a)], a),
        typeVars: [a],
      },
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("head() expects an array");
        }
        if (arr.length === 0) {
          throw new Error("head() called on empty array");
        }
        return arr[0];
      },
      description: "Returns the first element of an array",
    },
  ],

  [
    "tail",
    {
      name: "tail",
      typeScheme: {
        type: createFunctionType([createArrayType(a)], createArrayType(a)),
        typeVars: [a],
      },
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("tail() expects an array");
        }
        if (arr.length === 0) {
          throw new Error("tail() called on empty array");
        }
        return arr.slice(1);
      },
      description: "Returns all elements except the first one",
    },
  ],

  [
    "push",
    {
      name: "push",
      typeScheme: {
        type: createFunctionType([createArrayType(a), a], createArrayType(a)),
        typeVars: [a],
      },
      implementation: (arr: any[], element: any) => {
        if (!Array.isArray(arr)) {
          throw new Error("push() expects an array as first argument");
        }
        return [...arr, element];
      },
      description: "Adds an element to the end of an array (returns new array)",
    },
  ],

  [
    "empty",
    {
      name: "empty",
      typeScheme: {
        type: createFunctionType([createArrayType(a)], createBooleanType()),
        typeVars: [a],
      },
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("empty() expects an array");
        }
        return arr.length === 0;
      },
      description: "Returns true if array is empty",
    },
  ],

  // === String Functions ===
  [
    "concat",
    {
      name: "concat",
      typeScheme: {
        type: createFunctionType([createStringType(), createStringType()], createStringType()),
        typeVars: [],
      },
      implementation: (str1: string, str2: string) => {
        if (typeof str1 !== "string" || typeof str2 !== "string") {
          throw new Error("concat() expects two strings");
        }
        return str1 + str2;
      },
      description: "Concatenates two strings",
    },
  ],

  [
    "substring",
    {
      name: "substring",
      typeScheme: {
        type: createFunctionType(
          [createStringType(), createNumberType(), createNumberType()],
          createStringType(),
        ),
        typeVars: [],
      },
      implementation: (str: string, start: number, end: number) => {
        if (typeof str !== "string") {
          throw new Error("substring() expects a string as first argument");
        }
        if (typeof start !== "number" || typeof end !== "number") {
          throw new Error("substring() expects numbers for start and end positions");
        }
        return str.substring(start, end);
      },
      description: "Returns a substring from start to end position",
    },
  ],

  [
    "strlen",
    {
      name: "strlen",
      typeScheme: {
        type: createFunctionType([createStringType()], createNumberType()),
        typeVars: [],
      },
      implementation: (str: string) => {
        if (typeof str !== "string") {
          throw new Error("strlen() expects a string");
        }
        return str.length;
      },
      description: "Returns the length of a string",
    },
  ],

  // === I/O Functions ===
  [
    "print",
    {
      name: "print",
      typeScheme: {
        type: createFunctionType([a], createUnitType()),
        typeVars: [a],
      },
      implementation: (value: any) => {
        console.log(formatValue(value));
        return null; // Unit type
      },
      description: "Prints a value to stdout",
    },
  ],

  [
    "println",
    {
      name: "println",
      typeScheme: {
        type: createFunctionType([a], createUnitType()),
        typeVars: [a],
      },
      implementation: (value: any) => {
        console.log(formatValue(value));
        return null; // Unit type
      },
      description: "Prints a value to stdout with newline",
    },
  ],

  [
    "readText",
    {
      name: "readText",
      typeScheme: {
        type: createFunctionType([createStringType()], createStringType()),
        typeVars: [],
      },
      implementation: (filepath: string) => {
        if (typeof filepath !== "string") {
          throw new Error("readText() expects a string filepath");
        }
        try {
          return Deno.readTextFileSync(filepath);
        } catch (error) {
          throw new Error(
            `Failed to read file ${filepath}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      },
      description: "Reads text from a file",
    },
  ],

  [
    "writeText",
    {
      name: "writeText",
      typeScheme: {
        type: createFunctionType([createStringType(), createStringType()], createUnitType()),
        typeVars: [],
      },
      implementation: (filepath: string, content: string) => {
        if (typeof filepath !== "string" || typeof content !== "string") {
          throw new Error("writeText() expects two strings (filepath, content)");
        }
        try {
          Deno.writeTextFileSync(filepath, content);
          return null; // Unit type
        } catch (error) {
          throw new Error(
            `Failed to write file ${filepath}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      },
      description: "Writes text to a file",
    },
  ],

  // === Math Functions ===
  [
    "sqrt",
    {
      name: "sqrt",
      typeScheme: {
        type: createFunctionType([createNumberType()], createNumberType()),
        typeVars: [],
      },
      implementation: (n: number) => {
        if (typeof n !== "number") {
          throw new Error("sqrt() expects a number");
        }
        return Math.sqrt(n);
      },
      description: "Returns the square root of a number",
    },
  ],

  [
    "abs",
    {
      name: "abs",
      typeScheme: {
        type: createFunctionType([createNumberType()], createNumberType()),
        typeVars: [],
      },
      implementation: (n: number) => {
        if (typeof n !== "number") {
          throw new Error("abs() expects a number");
        }
        return Math.abs(n);
      },
      description: "Returns the absolute value of a number",
    },
  ],

  [
    "floor",
    {
      name: "floor",
      typeScheme: {
        type: createFunctionType([createNumberType()], createNumberType()),
        typeVars: [],
      },
      implementation: (n: number) => {
        if (typeof n !== "number") {
          throw new Error("floor() expects a number");
        }
        return Math.floor(n);
      },
      description: "Returns the largest integer less than or equal to the number",
    },
  ],

  [
    "ceil",
    {
      name: "ceil",
      typeScheme: {
        type: createFunctionType([createNumberType()], createNumberType()),
        typeVars: [],
      },
      implementation: (n: number) => {
        if (typeof n !== "number") {
          throw new Error("ceil() expects a number");
        }
        return Math.ceil(n);
      },
      description: "Returns the smallest integer greater than or equal to the number",
    },
  ],

  // === Type Conversion Functions ===
  [
    "toString",
    {
      name: "toString",
      typeScheme: {
        type: createFunctionType([a], createStringType()),
        typeVars: [a],
      },
      implementation: (value: any) => {
        return formatValue(value);
      },
      description: "Converts any value to its string representation",
    },
  ],

  [
    "toNumber",
    {
      name: "toNumber",
      typeScheme: {
        type: createFunctionType([createStringType()], createNumberType()),
        typeVars: [],
      },
      implementation: (str: string) => {
        if (typeof str !== "string") {
          throw new Error("toNumber() expects a string");
        }
        const num = Number(str);
        if (isNaN(num)) {
          throw new Error(`Cannot convert "${str}" to number`);
        }
        return num;
      },
      description: "Converts a string to a number",
    },
  ],
]);

// Helper function to format values for output
function formatValue(value: any): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(", ")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, val]) => `${key}: ${formatValue(val)}`)
      .join(", ");
    return `{ ${entries} }`;
  }
  if (typeof value === "function") {
    return "<function>";
  }
  return String(value);
}

// Get all builtin function names
export function getBuiltinNames(): string[] {
  return Array.from(builtinFunctions.keys());
}

// Get a specific builtin function
export function getBuiltin(name: string): BuiltinFunction | undefined {
  return builtinFunctions.get(name);
}

// Check if a name is a builtin function
export function isBuiltin(name: string): boolean {
  return builtinFunctions.has(name);
}
