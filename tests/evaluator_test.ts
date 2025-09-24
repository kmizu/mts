// Test for the Evaluator

import { Evaluator, RuntimeError } from "../src/evaluator.ts";
import { Parser } from "../src/parser.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

function evaluate(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const evaluator = new Evaluator();
  return evaluator.evaluate(ast);
}

// ========== Literal Evaluation ==========

Deno.test("Evaluator - number literals", () => {
  assertEquals(evaluate("42"), 42);
  assertEquals(evaluate("3.14"), 3.14);
  assertEquals(evaluate("-10"), -10);
});

Deno.test("Evaluator - string literals", () => {
  assertEquals(evaluate(`"hello"`), "hello");
  assertEquals(evaluate(`""`), "");
  assertEquals(evaluate(`"world"`), "world");
});

Deno.test("Evaluator - boolean literals", () => {
  assertEquals(evaluate("true"), true);
  assertEquals(evaluate("false"), false);
});

Deno.test("Evaluator - null and undefined", () => {
  assertEquals(evaluate("null"), null);
  assertEquals(evaluate("undefined"), undefined);
});

// ========== Variable Declaration and Access ==========

Deno.test("Evaluator - variable declaration", () => {
  assertEquals(evaluate("let x = 42; x"), 42);
  assertEquals(evaluate(`let name = "Alice"; name`), "Alice");
  assertEquals(evaluate("let flag = true; flag"), true);
});

Deno.test("Evaluator - undefined variable error", () => {
  assertThrows(
    () => evaluate("unknownVar"),
    RuntimeError,
    "Undefined variable: unknownVar",
  );
});

Deno.test("Evaluator - uninitialized recursive binding error", () => {
  assertThrows(
    () => evaluate("let selfRef = { self: selfRef }; selfRef"),
    RuntimeError,
    "Variable 'selfRef' referenced before initialization",
  );
});

// ========== Binary Expressions ==========

Deno.test("Evaluator - arithmetic operations", () => {
  assertEquals(evaluate("1 + 2"), 3);
  assertEquals(evaluate("10 - 5"), 5);
  assertEquals(evaluate("3 * 4"), 12);
  assertEquals(evaluate("15 / 3"), 5);
  assertEquals(evaluate("17 % 5"), 2);
});

Deno.test("Evaluator - string concatenation", () => {
  assertEquals(evaluate(`"hello" + " world"`), "hello world");
  assertEquals(evaluate(`"The answer is " + 42`), "The answer is 42");
  assertEquals(evaluate(`42 + " is the answer"`), "42 is the answer");
});

Deno.test("Evaluator - comparison operations", () => {
  assertEquals(evaluate("5 > 3"), true);
  assertEquals(evaluate("2 < 1"), false);
  assertEquals(evaluate("5 >= 5"), true);
  assertEquals(evaluate("3 <= 2"), false);
  assertEquals(evaluate("42 == 42"), true);
  assertEquals(evaluate("42 != 24"), true);
});

Deno.test("Evaluator - logical operations", () => {
  assertEquals(evaluate("true && true"), true);
  assertEquals(evaluate("true && false"), false);
  assertEquals(evaluate("false || true"), true);
  assertEquals(evaluate("false || false"), false);
});

Deno.test("Evaluator - division by zero error", () => {
  assertThrows(
    () => evaluate("10 / 0"),
    RuntimeError,
    "Division by zero",
  );
});

// ========== Unary Expressions ==========

Deno.test("Evaluator - unary minus", () => {
  assertEquals(evaluate("-42"), -42);
  assertEquals(evaluate("-(10 + 5)"), -15);
});

Deno.test("Evaluator - logical not", () => {
  assertEquals(evaluate("!true"), false);
  assertEquals(evaluate("!false"), true);
  assertEquals(evaluate("!0"), true);
  assertEquals(evaluate("!42"), false);
  assertEquals(evaluate(`!""`), true);
  assertEquals(evaluate(`!"hello"`), false);
});

// ========== Array Expressions ==========

Deno.test("Evaluator - array literals", () => {
  assertEquals(evaluate("[1, 2, 3]"), [1, 2, 3]);
  assertEquals(evaluate("[]"), []);
  assertEquals(evaluate(`["a", "b", "c"]`), ["a", "b", "c"]);
});

Deno.test("Evaluator - array indexing", () => {
  assertEquals(evaluate("let arr = [1, 2, 3]; arr[0]"), 1);
  assertEquals(evaluate("let arr = [1, 2, 3]; arr[2]"), 3);
  assertEquals(evaluate(`let words = ["hello", "world"]; words[1]`), "world");
});

Deno.test("Evaluator - array index out of bounds", () => {
  assertThrows(
    () => evaluate("let arr = [1, 2, 3]; arr[5]"),
    RuntimeError,
    "Array index out of bounds",
  );
});

// ========== Dictionary Expressions ==========

Deno.test("Evaluator - dictionary literals", () => {
  const dict1 = evaluate('["key": "value", "num": 42]');
  assertEquals(dict1 instanceof Map, true);
  assertEquals((dict1 as Map<any, any>).get("key"), "value");
  assertEquals((dict1 as Map<any, any>).get("num"), 42);

  const emptyDict = evaluate("[]");
  assertEquals(Array.isArray(emptyDict), true);
  assertEquals((emptyDict as any[]).length, 0);

  const dictWithNumbers = evaluate('[1: "one", 2: "two", 3: "three"]');
  assertEquals(dictWithNumbers instanceof Map, true);
  assertEquals((dictWithNumbers as Map<any, any>).get(1), "one");
  assertEquals((dictWithNumbers as Map<any, any>).get(2), "two");
  assertEquals((dictWithNumbers as Map<any, any>).get(3), "three");
});

Deno.test("Evaluator - dictionary access", () => {
  assertEquals(evaluate('let dict = ["name": "Alice", "age": 30]; dict["name"]'), "Alice");
  assertEquals(evaluate('let dict = ["name": "Alice", "age": 30]; dict["age"]'), 30);
  assertEquals(evaluate('let nums = [1: "one", 2: "two"]; nums[1]'), "one");
  assertEquals(evaluate('let nums = [1: "one", 2: "two"]; nums[2]'), "two");
});

Deno.test("Evaluator - dictionary access non-existent key", () => {
  assertEquals(evaluate('let dict = ["a": 1]; dict["b"]'), undefined);
  assertEquals(evaluate('let dict = [1: "one"]; dict[2]'), undefined);
});

Deno.test("Evaluator - nested dictionaries", () => {
  const result = evaluate(`
    let outer = ["inner": ["key": "value"]];
    outer["inner"]["key"]
  `);
  assertEquals(result, "value");
});

Deno.test("Evaluator - mixed key types dictionary", () => {
  const dict = evaluate('["string": 1, 42: "number", true: "boolean"]');
  assertEquals(dict instanceof Map, true);
  assertEquals((dict as Map<any, any>).get("string"), 1);
  assertEquals((dict as Map<any, any>).get(42), "number");
  assertEquals((dict as Map<any, any>).get(true), "boolean");
});

Deno.test("Evaluator - dictionary with computed keys", () => {
  assertEquals(evaluate('let key = "dynamic"; [key: "value"][key]'), "value");
  assertEquals(evaluate('let n = 5; [n + 1: "six"][6]'), "six");
});

// ========== Object Expressions ==========

Deno.test("Evaluator - object literals", () => {
  const result = evaluate(`{ name: "John", age: 30 }`);
  assertEquals(result, { name: "John", age: 30 });
});

Deno.test("Evaluator - object property access", () => {
  assertEquals(evaluate(`let person = { name: "Alice", age: 25 }; person.name`), "Alice");
  assertEquals(evaluate(`let person = { name: "Alice", age: 25 }; person.age`), 25);
});

Deno.test("Evaluator - property access on null error", () => {
  assertThrows(
    () => evaluate("let x = null; x.prop"),
    RuntimeError,
    "Cannot access property of null or undefined",
  );
});

// ========== Function Expressions ==========

Deno.test("Evaluator - function definition and call", () => {
  assertEquals(evaluate("let add = (x, y) => x + y; add(5, 3)"), 8);
  assertEquals(evaluate("let square = (x) => x * x; square(4)"), 16);
});

Deno.test("Evaluator - function with closure", () => {
  assertEquals(
    evaluate(`
    let makeAdder = (x) => (y) => x + y;
    let add5 = makeAdder(5);
    add5(3)
  `),
    8,
  );
});

Deno.test("Evaluator - mutual recursion with let and", () => {
  assertEquals(
    evaluate(`
    let even = (n) => if (n == 0) true else odd(n - 1)
      and odd = (n) => if (n == 0) false else even(n - 1);
    even(4)
  `),
    true,
  );

  assertEquals(
    evaluate(`
    let even = (n) => if (n == 0) true else odd(n - 1)
      and odd = (n) => if (n == 0) false else even(n - 1);
    odd(7)
  `),
    true,
  );
});

Deno.test("Evaluator - function arity mismatch", () => {
  assertThrows(
    () => evaluate("let add = (x, y) => x + y; add(5)"),
    RuntimeError,
    "Function expects 2 arguments, got 1",
  );
});

// ========== If Expressions ==========

Deno.test("Evaluator - if expression with else", () => {
  assertEquals(evaluate(`if (true) "yes" else "no"`), "yes");
  assertEquals(evaluate(`if (false) "yes" else "no"`), "no");
  assertEquals(evaluate(`if (5 > 3) 10 else 20`), 10);
});

Deno.test("Evaluator - if expression without else", () => {
  assertEquals(evaluate(`if (true) 42`), 42);
  assertEquals(evaluate(`if (false) 42`), null);
});

// ========== Block Expressions ==========

Deno.test("Evaluator - block expressions", () => {
  assertEquals(
    evaluate(`{
    let x = 10;
    let y = 20;
    x + y
  }`),
    30,
  );
});

Deno.test("Evaluator - block scoping", () => {
  assertEquals(
    evaluate(`
    let x = 10;
    let result = {
      let x = 20;
      x + 5
    };
    result
  `),
    25,
  );
});

// ========== Match Expressions ==========

Deno.test("Evaluator - match expressions", () => {
  assertEquals(
    evaluate(`
    match 2 {
      1 => "one",
      2 => "two",
      _ => "other"
    }
  `),
    "two",
  );

  assertEquals(
    evaluate(`
    match 5 {
      1 => "one",
      2 => "two",
      _ => "other"
    }
  `),
    "other",
  );
});

Deno.test("Evaluator - match expressions with guards", () => {
  assertEquals(
    evaluate(`
    match 5 {
      x if x < 0 => "negative",
      x if x == 0 => "zero",
      x if x > 0 => "positive"
    }
  `),
    "positive",
  );

  assertEquals(
    evaluate(`
    match -10 {
      x if x < 0 => "negative",
      x if x == 0 => "zero",
      x if x > 0 => "positive"
    }
  `),
    "negative",
  );

  assertEquals(
    evaluate(`
    match 0 {
      x if x < 0 => "negative",
      x if x == 0 => "zero",
      x if x > 0 => "positive"
    }
  `),
    "zero",
  );

  assertEquals(
    evaluate(`
    match 150 {
      x if x > 100 => "large",
      x if x > 50 => "medium",
      x if x > 0 => "small",
      _ => "other"
    }
  `),
    "large",
  );
});

// ========== Builtin Functions ==========

Deno.test("Evaluator - builtin array functions", () => {
  assertEquals(evaluate("length([1, 2, 3])"), 3);
  assertEquals(evaluate("head([1, 2, 3])"), 1);
  assertEquals(evaluate("tail([1, 2, 3])"), [2, 3]);
  assertEquals(evaluate("push([1, 2], 3)"), [1, 2, 3]);
  assertEquals(evaluate("empty([])"), true);
  assertEquals(evaluate("empty([1])"), false);
});

Deno.test("Evaluator - builtin string functions", () => {
  assertEquals(evaluate(`concat("hello", " world")`), "hello world");
  assertEquals(evaluate(`substring("hello", 1, 4)`), "ell");
  assertEquals(evaluate(`strlen("hello")`), 5);
});

Deno.test("Evaluator - builtin math functions", () => {
  assertEquals(evaluate("sqrt(16)"), 4);
  assertEquals(evaluate("abs(-5)"), 5);
  assertEquals(evaluate("floor(3.7)"), 3);
  assertEquals(evaluate("ceil(3.2)"), 4);
});

Deno.test("Evaluator - builtin type conversion", () => {
  assertEquals(evaluate(`toString(42)`), "42");
  assertEquals(evaluate(`toNumber("123")`), 123);
});

// ========== Complex Expressions ==========

Deno.test("Evaluator - complex nested expressions", () => {
  assertEquals(
    evaluate(`
    let factorial = (n) => {
      if (n <= 1) {
        1
      } else {
        n * factorial(n - 1)
      }
    };
    factorial(5)
  `),
    120,
  );
});

Deno.test("Evaluator - higher-order functions", () => {
  assertEquals(
    evaluate(`
    let apply = (f, x) => f(x);
    let double = (x) => x * 2;
    apply(double, 21)
  `),
    42,
  );
});

Deno.test("Evaluator - array of functions", () => {
  assertEquals(
    evaluate(`
    let funcs = [
      (x) => x + 1,
      (x) => x * 2,
      (x) => x - 1
    ];
    let f = funcs[1];
    f(5)
  `),
    10,
  );
});

// ========== Error Cases ==========

Deno.test("Evaluator - type error in arithmetic", () => {
  assertThrows(
    () => evaluate(`"hello" - 5`),
    RuntimeError,
    "Operator - requires numeric operands",
  );
});

Deno.test("Evaluator - calling non-function", () => {
  assertThrows(
    () => evaluate("let x = 42; x()"),
    RuntimeError,
    "Cannot call non-function value",
  );
});

Deno.test("Evaluator - accessing property of non-object", () => {
  assertThrows(
    () => evaluate("let x = 42; x.prop"),
    RuntimeError,
    "Cannot access property of non-object",
  );
});

Deno.test("Evaluator - indexing non-array", () => {
  assertThrows(
    () => evaluate("let x = 42; x[0]"),
    RuntimeError,
    "Cannot index non-array, non-dictionary value",
  );
});
