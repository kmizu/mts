// Test for Built-in Functions

import { builtinFunctions, getBuiltin, getBuiltinNames, isBuiltin } from "../src/builtins.ts";
import { ArrayType, BooleanType, NumberType, StringType, UnitType } from "../src/types.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

// ========== Builtin Function Registry Tests ==========

Deno.test("Builtins - registry functions", () => {
  // Test getBuiltinNames
  const names = getBuiltinNames();
  assertEquals(names.includes("print"), true);
  assertEquals(names.includes("length"), true);
  assertEquals(names.includes("readText"), true);

  // Test isBuiltin
  assertEquals(isBuiltin("print"), true);
  assertEquals(isBuiltin("nonexistent"), false);

  // Test getBuiltin
  const printFunc = getBuiltin("print");
  assertEquals(printFunc?.name, "print");
  assertEquals(getBuiltin("nonexistent"), undefined);
});

// ========== Array Functions Tests ==========

Deno.test("Builtins - length function", () => {
  const lengthFunc = getBuiltin("length")!;

  assertEquals(lengthFunc.implementation([1, 2, 3]), 3);
  assertEquals(lengthFunc.implementation([]), 0);
  assertEquals(lengthFunc.implementation(["a", "b"]), 2);

  assertThrows(() => lengthFunc.implementation("not an array"));
});

Deno.test("Builtins - head function", () => {
  const headFunc = getBuiltin("head")!;

  assertEquals(headFunc.implementation([1, 2, 3]), 1);
  assertEquals(headFunc.implementation(["hello", "world"]), "hello");

  assertThrows(() => headFunc.implementation([]));
  assertThrows(() => headFunc.implementation("not an array"));
});

Deno.test("Builtins - tail function", () => {
  const tailFunc = getBuiltin("tail")!;

  assertEquals(tailFunc.implementation([1, 2, 3]), [2, 3]);
  assertEquals(tailFunc.implementation([1]), []);
  assertEquals(tailFunc.implementation(["a", "b", "c"]), ["b", "c"]);

  assertThrows(() => tailFunc.implementation([]));
  assertThrows(() => tailFunc.implementation("not an array"));
});

Deno.test("Builtins - push function", () => {
  const pushFunc = getBuiltin("push")!;

  assertEquals(pushFunc.implementation([1, 2], 3), [1, 2, 3]);
  assertEquals(pushFunc.implementation([], "hello"), ["hello"]);
  assertEquals(pushFunc.implementation(["a"], "b"), ["a", "b"]);

  assertThrows(() => pushFunc.implementation("not an array", 1));
});

Deno.test("Builtins - empty function", () => {
  const emptyFunc = getBuiltin("empty")!;

  assertEquals(emptyFunc.implementation([]), true);
  assertEquals(emptyFunc.implementation([1]), false);
  assertEquals(emptyFunc.implementation([1, 2, 3]), false);

  assertThrows(() => emptyFunc.implementation("not an array"));
});

Deno.test("Builtins - range function", () => {
  const rangeFunc = getBuiltin("range")!;

  assertEquals(rangeFunc.implementation(1, 3), [1, 2, 3]);
  assertEquals(rangeFunc.implementation(3, 1), [3, 2, 1]);
  assertEquals(rangeFunc.implementation(0, 0), [0]);

  assertThrows(() => rangeFunc.implementation("a", 3));
});

Deno.test("Builtins - sum and product functions", () => {
  const sumFunc = getBuiltin("sum")!;
  const productFunc = getBuiltin("product")!;

  assertEquals(sumFunc.implementation([1, 2, 3, 4]), 10);
  assertEquals(productFunc.implementation([1, 2, 3, 4]), 24);

  assertThrows(() => sumFunc.implementation([1, "two"]));
  assertThrows(() => productFunc.implementation([1, "two"]));
});

Deno.test("Builtins - flatten function", () => {
  const flattenFunc = getBuiltin("flatten")!;

  assertEquals(flattenFunc.implementation([[1, 2], [3, 4]]), [1, 2, 3, 4]);
  assertEquals(flattenFunc.implementation([[], [1], []]), [1]);

  assertThrows(() => flattenFunc.implementation([1, 2]));
});

Deno.test("Builtins - unique function", () => {
  const uniqueFunc = getBuiltin("unique")!;

  assertEquals(uniqueFunc.implementation([1, 2, 2, 3, 1]), [1, 2, 3]);
  assertEquals(uniqueFunc.implementation(["a", "a", "b"]), ["a", "b"]);

  assertThrows(() => uniqueFunc.implementation("not an array"));
});

Deno.test("Builtins - chunk function", () => {
  const chunkFunc = getBuiltin("chunk")!;

  assertEquals(chunkFunc.implementation([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assertEquals(chunkFunc.implementation([1, 2, 3], 5), [[1, 2, 3]]);

  assertThrows(() => chunkFunc.implementation([1, 2], 0));
});

Deno.test("Builtins - zip function", () => {
  const zipFunc = getBuiltin("zip")!;

  assertEquals(zipFunc.implementation([1, 2], ["a", "b", "c"]), [
    { first: 1, second: "a" },
    { first: 2, second: "b" },
  ]);

  assertThrows(() => zipFunc.implementation([1, 2], "not an array"));
});

// ========== String Functions Tests ==========

Deno.test("Builtins - concat function", () => {
  const concatFunc = getBuiltin("concat")!;

  assertEquals(concatFunc.implementation("hello", " world"), "hello world");
  assertEquals(concatFunc.implementation("", "test"), "test");
  assertEquals(concatFunc.implementation("a", ""), "a");

  assertThrows(() => concatFunc.implementation(123, "string"));
  assertThrows(() => concatFunc.implementation("string", 456));
});

Deno.test("Builtins - substring function", () => {
  const substringFunc = getBuiltin("substring")!;

  assertEquals(substringFunc.implementation("hello world", 0, 5), "hello");
  assertEquals(substringFunc.implementation("hello world", 6, 11), "world");
  assertEquals(substringFunc.implementation("test", 1, 3), "es");

  assertThrows(() => substringFunc.implementation(123, 0, 5));
  assertThrows(() => substringFunc.implementation("test", "0", 5));
});

Deno.test("Builtins - strlen function", () => {
  const strlenFunc = getBuiltin("strlen")!;

  assertEquals(strlenFunc.implementation("hello"), 5);
  assertEquals(strlenFunc.implementation(""), 0);
  assertEquals(strlenFunc.implementation("test string"), 11);

  assertThrows(() => strlenFunc.implementation(123));
});

// ========== Math Functions Tests ==========

Deno.test("Builtins - sqrt function", () => {
  const sqrtFunc = getBuiltin("sqrt")!;

  assertEquals(sqrtFunc.implementation(4), 2);
  assertEquals(sqrtFunc.implementation(9), 3);
  assertEquals(sqrtFunc.implementation(0), 0);

  assertThrows(() => sqrtFunc.implementation("not a number"));
});

Deno.test("Builtins - abs function", () => {
  const absFunc = getBuiltin("abs")!;

  assertEquals(absFunc.implementation(5), 5);
  assertEquals(absFunc.implementation(-5), 5);
  assertEquals(absFunc.implementation(0), 0);

  assertThrows(() => absFunc.implementation("not a number"));
});

Deno.test("Builtins - floor function", () => {
  const floorFunc = getBuiltin("floor")!;

  assertEquals(floorFunc.implementation(3.7), 3);
  assertEquals(floorFunc.implementation(3.2), 3);
  assertEquals(floorFunc.implementation(-2.1), -3);

  assertThrows(() => floorFunc.implementation("not a number"));
});

Deno.test("Builtins - ceil function", () => {
  const ceilFunc = getBuiltin("ceil")!;

  assertEquals(ceilFunc.implementation(3.1), 4);
  assertEquals(ceilFunc.implementation(3.9), 4);
  assertEquals(ceilFunc.implementation(-2.9), -2);

  assertThrows(() => ceilFunc.implementation("not a number"));
});

// ========== Type Conversion Functions Tests ==========

Deno.test("Builtins - toString function", () => {
  const toStringFunc = getBuiltin("toString")!;

  assertEquals(toStringFunc.implementation(42), "42");
  assertEquals(toStringFunc.implementation(true), "true");
  assertEquals(toStringFunc.implementation("hello"), "hello");
  assertEquals(toStringFunc.implementation([1, 2, 3]), "[1, 2, 3]");
  assertEquals(toStringFunc.implementation({ a: 1, b: 2 }), "{ a: 1, b: 2 }");
  assertEquals(toStringFunc.implementation(null), "null");
  assertEquals(toStringFunc.implementation(undefined), "undefined");
});

Deno.test("Builtins - toNumber function", () => {
  const toNumberFunc = getBuiltin("toNumber")!;

  assertEquals(toNumberFunc.implementation("42"), 42);
  assertEquals(toNumberFunc.implementation("3.14"), 3.14);
  assertEquals(toNumberFunc.implementation("-10"), -10);

  assertThrows(() => toNumberFunc.implementation("not a number"));
  assertThrows(() => toNumberFunc.implementation(123));
});

// ========== Type Scheme Tests ==========

Deno.test("Builtins - type schemes are correct", () => {
  const lengthFunc = getBuiltin("length")!;
  assertEquals(lengthFunc.typeScheme.type.kind, "FunctionType");
  assertEquals(lengthFunc.typeScheme.typeVars.length, 1);

  const concatFunc = getBuiltin("concat")!;
  assertEquals(concatFunc.typeScheme.type.kind, "FunctionType");
  assertEquals(concatFunc.typeScheme.typeVars.length, 0);

  const printFunc = getBuiltin("print")!;
  assertEquals(printFunc.typeScheme.type.kind, "FunctionType");
  assertEquals(printFunc.typeScheme.typeVars.length, 1);
});

// ========== Dictionary Function Tests ==========

Deno.test("Builtins - dict basic operations", () => {
  const dict = new Map<any, any>([["a", 1], ["b", 2]]);

  const keysFunc = getBuiltin("dictKeys")!;
  const valuesFunc = getBuiltin("dictValues")!;
  const sizeFunc = getBuiltin("dictSize")!;
  const hasFunc = getBuiltin("dictHas")!;

  assertEquals(keysFunc.implementation(dict), ["a", "b"]);
  assertEquals(valuesFunc.implementation(dict), [1, 2]);
  assertEquals(sizeFunc.implementation(dict), 2);
  assertEquals(hasFunc.implementation(dict, "a"), true);
  assertEquals(hasFunc.implementation(dict, "z"), false);
});

Deno.test("Builtins - dictEntries and dictFromEntries", () => {
  const dict = new Map<any, any>([[1, "one"], [2, "two"]]);
  const entriesFunc = getBuiltin("dictEntries")!;
  const fromEntriesFunc = getBuiltin("dictFromEntries")!;

  const entries = entriesFunc.implementation(dict);
  assertEquals(entries, [
    { key: 1, value: "one" },
    { key: 2, value: "two" },
  ]);

  const rebuilt = fromEntriesFunc.implementation(entries);
  assertEquals(Array.from(rebuilt.entries()), Array.from(dict.entries()));
});

Deno.test("Builtins - dictSet, dictDelete, and dictMerge", () => {
  const dictSetFunc = getBuiltin("dictSet")!;
  const dictDeleteFunc = getBuiltin("dictDelete")!;
  const dictMergeFunc = getBuiltin("dictMerge")!;

  const base = new Map<any, any>([["x", 1]]);
  const withY = dictSetFunc.implementation(base, "y", 2);
  assertEquals(Array.from(withY.entries()), [["x", 1], ["y", 2]]);

  const withoutX = dictDeleteFunc.implementation(withY, "x");
  assertEquals(Array.from(withoutX.entries()), [["y", 2]]);

  const merged = dictMergeFunc.implementation(withoutX, new Map([["z", 3]]));
  assertEquals(Array.from(merged.entries()), [["y", 2], ["z", 3]]);
});

// ========== I/O Functions Tests (Mock Tests) ==========

Deno.test("Builtins - print function", () => {
  const printFunc = getBuiltin("print")!;

  // Mock console.log to capture output
  const originalLog = console.log;
  let capturedOutput = "";
  console.log = (msg: string) => {
    capturedOutput = msg;
  };

  const result = printFunc.implementation("hello world");
  assertEquals(result, null); // Should return Unit type (null)
  assertEquals(capturedOutput, "hello world");

  printFunc.implementation(42);
  assertEquals(capturedOutput, "42");

  printFunc.implementation([1, 2, 3]);
  assertEquals(capturedOutput, "[1, 2, 3]");

  // Restore console.log
  console.log = originalLog;
});

// Note: File I/O tests would require actual file operations
// For now, we test that the functions exist and have correct type signatures
Deno.test("Builtins - file I/O functions exist", () => {
  const readTextFunc = getBuiltin("readText");
  assertEquals(readTextFunc?.name, "readText");
  assertEquals(readTextFunc?.typeScheme.type.kind, "FunctionType");

  const writeTextFunc = getBuiltin("writeText");
  assertEquals(writeTextFunc?.name, "writeText");
  assertEquals(writeTextFunc?.typeScheme.type.kind, "FunctionType");
});
