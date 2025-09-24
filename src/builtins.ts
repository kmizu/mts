// Built-in Functions for MTS

import {
  ArrayType,
  BooleanType,
  dictType,
  FunctionType,
  NumberType,
  objectType,
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

  [
    "range",
    {
      name: "range",
      typeScheme: {
        type: createFunctionType(
          [createNumberType(), createNumberType()],
          createArrayType(createNumberType()),
        ),
        typeVars: [],
      },
      implementation: (start: number, end: number) => {
        if (typeof start !== "number" || typeof end !== "number") {
          throw new Error("range() expects two numbers");
        }
        const step = start <= end ? 1 : -1;
        const result: number[] = [];
        if (start <= end) {
          for (let value = start; value <= end; value += step) {
            result.push(value);
          }
        } else {
          for (let value = start; value >= end; value += step) {
            result.push(value);
          }
        }
        return result;
      },
      description: "Creates an inclusive range of numbers",
    },
  ],

  [
    "sum",
    {
      name: "sum",
      typeScheme: {
        type: createFunctionType([createArrayType(createNumberType())], createNumberType()),
        typeVars: [],
      },
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("sum() expects an array");
        }
        return arr.reduce((acc: number, value: any) => {
          if (typeof value !== "number") {
            throw new Error("sum() expects an array of numbers");
          }
          return acc + value;
        }, 0);
      },
      description: "Sums all numbers in an array",
    },
  ],

  [
    "product",
    {
      name: "product",
      typeScheme: {
        type: createFunctionType([createArrayType(createNumberType())], createNumberType()),
        typeVars: [],
      },
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("product() expects an array");
        }
        return arr.reduce((acc: number, value: any) => {
          if (typeof value !== "number") {
            throw new Error("product() expects an array of numbers");
          }
          return acc * value;
        }, 1);
      },
      description: "Calculates the product of numbers in an array",
    },
  ],

  [
    "flatten",
    {
      name: "flatten",
      typeScheme: (() => {
        const element = createTypeVar("flattenElem");
        return {
          type: createFunctionType(
            [createArrayType(createArrayType(element))],
            createArrayType(element),
          ),
          typeVars: [element],
        };
      })(),
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("flatten() expects an array of arrays");
        }
        return arr.reduce((acc: any[], value: any) => {
          if (!Array.isArray(value)) {
            throw new Error("flatten() expects an array of arrays");
          }
          return acc.concat(value);
        }, []);
      },
      description: "Flattens an array by one level",
    },
  ],

  [
    "unique",
    {
      name: "unique",
      typeScheme: (() => {
        const element = createTypeVar("uniqueElem");
        return {
          type: createFunctionType([createArrayType(element)], createArrayType(element)),
          typeVars: [element],
        };
      })(),
      implementation: (arr: any[]) => {
        if (!Array.isArray(arr)) {
          throw new Error("unique() expects an array");
        }
        const seen = new Set<any>();
        const result: any[] = [];
        for (const value of arr) {
          if (!seen.has(value)) {
            seen.add(value);
            result.push(value);
          }
        }
        return result;
      },
      description: "Removes duplicate elements while preserving order",
    },
  ],

  [
    "chunk",
    {
      name: "chunk",
      typeScheme: (() => {
        const element = createTypeVar("chunkElem");
        return {
          type: createFunctionType(
            [createArrayType(element), createNumberType()],
            createArrayType(createArrayType(element)),
          ),
          typeVars: [element],
        };
      })(),
      implementation: (arr: any[], size: number) => {
        if (!Array.isArray(arr)) {
          throw new Error("chunk() expects an array");
        }
        if (typeof size !== "number" || size <= 0) {
          throw new Error("chunk() expects a positive chunk size");
        }
        const result: any[] = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        return result;
      },
      description: "Splits an array into equally sized chunks",
    },
  ],

  [
    "zip",
    {
      name: "zip",
      typeScheme: (() => {
        const first = createTypeVar("zipFirst");
        const second = createTypeVar("zipSecond");
        const fields = new Map<string, Type>([
          ["first", first],
          ["second", second],
        ]);
        return {
          type: createFunctionType(
            [createArrayType(first), createArrayType(second)],
            createArrayType(objectType(fields)),
          ),
          typeVars: [first, second],
        };
      })(),
      implementation: (left: any[], right: any[]) => {
        if (!Array.isArray(left) || !Array.isArray(right)) {
          throw new Error("zip() expects two arrays");
        }
        const length = Math.min(left.length, right.length);
        const result: any[] = [];
        for (let i = 0; i < length; i++) {
          result.push({ first: left[i], second: right[i] });
        }
        return result;
      },
      description: "Combines two arrays into an array of pairs",
    },
  ],

  // === Dictionary Functions ===
  [
    "dictKeys",
    {
      name: "dictKeys",
      typeScheme: (() => {
        const key = createTypeVar("dictKey");
        const value = createTypeVar("dictValue");
        return {
          type: createFunctionType([dictType(key, value)], createArrayType(key)),
          typeVars: [key, value],
        };
      })(),
      implementation: (dict: Map<any, any>) => {
        if (!(dict instanceof Map)) {
          throw new Error("dictKeys() expects a dictionary");
        }
        return Array.from(dict.keys());
      },
      description: "Returns an array of dictionary keys",
    },
  ],

  [
    "dictValues",
    {
      name: "dictValues",
      typeScheme: (() => {
        const key = createTypeVar("dictValKey");
        const value = createTypeVar("dictValValue");
        return {
          type: createFunctionType([dictType(key, value)], createArrayType(value)),
          typeVars: [key, value],
        };
      })(),
      implementation: (dict: Map<any, any>) => {
        if (!(dict instanceof Map)) {
          throw new Error("dictValues() expects a dictionary");
        }
        return Array.from(dict.values());
      },
      description: "Returns an array of dictionary values",
    },
  ],

  [
    "dictEntries",
    {
      name: "dictEntries",
      typeScheme: (() => {
        const key = createTypeVar("dictEntryKey");
        const value = createTypeVar("dictEntryValue");
        const entryFields = new Map<string, Type>([
          ["key", key],
          ["value", value],
        ]);
        return {
          type: createFunctionType(
            [dictType(key, value)],
            createArrayType(objectType(entryFields)),
          ),
          typeVars: [key, value],
        };
      })(),
      implementation: (dict: Map<any, any>) => {
        if (!(dict instanceof Map)) {
          throw new Error("dictEntries() expects a dictionary");
        }
        return Array.from(dict.entries()).map(([key, value]) => ({ key, value }));
      },
      description: "Returns an array of { key, value } pairs",
    },
  ],

  [
    "dictFromEntries",
    {
      name: "dictFromEntries",
      typeScheme: (() => {
        const key = createTypeVar("dictFromKey");
        const value = createTypeVar("dictFromValue");
        const entryFields = new Map<string, Type>([
          ["key", key],
          ["value", value],
        ]);
        return {
          type: createFunctionType(
            [createArrayType(objectType(entryFields))],
            dictType(key, value),
          ),
          typeVars: [key, value],
        };
      })(),
      implementation: (entries: any[]) => {
        if (!Array.isArray(entries)) {
          throw new Error("dictFromEntries() expects an array of entries");
        }
        const map = new Map<any, any>();
        for (const entry of entries) {
          if (!entry || typeof entry !== "object" || !("key" in entry) || !("value" in entry)) {
            throw new Error("dictFromEntries() expects entries of the form { key, value }");
          }
          map.set(entry.key, entry.value);
        }
        return map;
      },
      description: "Creates a dictionary from an array of { key, value } objects",
    },
  ],

  [
    "dictMerge",
    {
      name: "dictMerge",
      typeScheme: (() => {
        const key = createTypeVar("dictMergeKey");
        const value = createTypeVar("dictMergeValue");
        return {
          type: createFunctionType(
            [dictType(key, value), dictType(key, value)],
            dictType(key, value),
          ),
          typeVars: [key, value],
        };
      })(),
      implementation: (left: Map<any, any>, right: Map<any, any>) => {
        if (!(left instanceof Map) || !(right instanceof Map)) {
          throw new Error("dictMerge() expects two dictionaries");
        }
        const merged = new Map<any, any>();
        for (const [key, value] of left.entries()) {
          merged.set(key, value);
        }
        for (const [key, value] of right.entries()) {
          merged.set(key, value);
        }
        return merged;
      },
      description: "Merges two dictionaries (right-hand values override left)",
    },
  ],

  [
    "dictHas",
    {
      name: "dictHas",
      typeScheme: (() => {
        const key = createTypeVar("dictHasKey");
        const value = createTypeVar("dictHasValue");
        return {
          type: createFunctionType([dictType(key, value), key], createBooleanType()),
          typeVars: [key, value],
        };
      })(),
      implementation: (dict: Map<any, any>, key: any) => {
        if (!(dict instanceof Map)) {
          throw new Error("dictHas() expects a dictionary");
        }
        return dict.has(key);
      },
      description: "Checks if a key exists in a dictionary",
    },
  ],

  [
    "dictSet",
    {
      name: "dictSet",
      typeScheme: (() => {
        const key = createTypeVar("dictSetKey");
        const value = createTypeVar("dictSetValue");
        return {
          type: createFunctionType([dictType(key, value), key, value], dictType(key, value)),
          typeVars: [key, value],
        };
      })(),
      implementation: (dict: Map<any, any>, key: any, value: any) => {
        if (!(dict instanceof Map)) {
          throw new Error("dictSet() expects a dictionary");
        }
        const result = new Map(dict);
        result.set(key, value);
        return result;
      },
      description: "Returns a new dictionary with an updated entry",
    },
  ],

  [
    "dictDelete",
    {
      name: "dictDelete",
      typeScheme: (() => {
        const key = createTypeVar("dictDeleteKey");
        const value = createTypeVar("dictDeleteValue");
        return {
          type: createFunctionType([dictType(key, value), key], dictType(key, value)),
          typeVars: [key, value],
        };
      })(),
      implementation: (dict: Map<any, any>, key: any) => {
        if (!(dict instanceof Map)) {
          throw new Error("dictDelete() expects a dictionary");
        }
        const result = new Map(dict);
        result.delete(key);
        return result;
      },
      description: "Returns a new dictionary without the specified key",
    },
  ],

  [
    "dictSize",
    {
      name: "dictSize",
      typeScheme: (() => {
        const key = createTypeVar("dictSizeKey");
        const value = createTypeVar("dictSizeValue");
        return {
          type: createFunctionType([dictType(key, value)], createNumberType()),
          typeVars: [key, value],
        };
      })(),
      implementation: (dict: Map<any, any>) => {
        if (!(dict instanceof Map)) {
          throw new Error("dictSize() expects a dictionary");
        }
        return dict.size;
      },
      description: "Returns the number of entries in a dictionary",
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
