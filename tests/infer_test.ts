// Test for the Type Inference Engine

import { TypeError, TypeInferrer } from "../src/infer.ts";
import { Parser } from "../src/parser.ts";
import { typeToString } from "../src/types.ts";
import { Expression, Program } from "../src/ast.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

function inferType(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  return inferrer.inferAndSolve(ast);
}

function inferExpressionType(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = inferrer.createInitialEnv();
  return inferrer.inferExpression(firstExpression(ast), env);
}

function firstExpression(program: Program): Expression {
  return program.body[0] as Expression;
}

// ========== Literal Type Inference ==========

Deno.test("Type Inference - number literal", () => {
  const env = inferType("42");
  // Number literals should have number type
  // Since this is a top-level expression, we don't store it in env
  // Let's test expression inference directly
  const parser = new Parser("42");
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env2 = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env2);
  assertEquals(type.kind, "NumberType");
});

Deno.test("Type Inference - string literal", () => {
  const parser = new Parser(`"hello"`);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "StringType");
});

Deno.test("Type Inference - boolean literal", () => {
  const parser = new Parser("true");
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "BooleanType");
});

Deno.test("Type Inference - null literal", () => {
  const parser = new Parser("null");
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "NullType");
});

Deno.test("Type Inference - undefined literal", () => {
  const parser = new Parser("undefined");
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "UndefinedType");
});

// ========== Variable Declaration ==========

Deno.test("Type Inference - variable declaration", () => {
  const env = inferType("let x = 42");
  const xScheme = env.get("x");
  assertEquals(xScheme?.type.kind, "NumberType");
});

Deno.test("Type Inference - string variable", () => {
  const env = inferType(`let name = "Alice"`);
  const scheme = env.get("name");
  assertEquals(scheme?.type.kind, "StringType");
});

Deno.test("Type Inference - boolean variable", () => {
  const env = inferType("let flag = true");
  const scheme = env.get("flag");
  assertEquals(scheme?.type.kind, "BooleanType");
});

// ========== Array Type Inference ==========

Deno.test("Type Inference - number array", () => {
  const env = inferType("let numbers = [1, 2, 3]");
  const scheme = env.get("numbers");
  assertEquals(scheme?.type.kind, "ArrayType");
  assertEquals((scheme?.type as any).elementType.kind, "NumberType");
});

Deno.test("Type Inference - string array", () => {
  const env = inferType(`let words = ["hello", "world"]`);
  const scheme = env.get("words");
  assertEquals(scheme?.type.kind, "ArrayType");
  assertEquals((scheme?.type as any).elementType.kind, "StringType");
});

Deno.test("Type Inference - empty array", () => {
  const env = inferType("let empty = []");
  const scheme = env.get("empty");
  assertEquals(scheme?.type.kind, "ArrayType");
  assertEquals((scheme?.type as any).elementType.kind, "TypeVar");
});

// ========== Object Type Inference ==========

Deno.test("Type Inference - simple object", () => {
  const env = inferType(`let person = { name: "John", age: 30 }`);
  const scheme = env.get("person");
  assertEquals(scheme?.type.kind, "ObjectType");

  const fields = (scheme?.type as any).row.fields;
  assertEquals(fields.get("name").kind, "StringType");
  assertEquals(fields.get("age").kind, "NumberType");
});

Deno.test("Type Inference - empty object", () => {
  const env = inferType("let obj = {}");
  const scheme = env.get("obj");
  assertEquals(scheme?.type.kind, "ObjectType");
  assertEquals((scheme?.type as any).row.fields.size, 0);
});

// ========== Function Type Inference ==========

Deno.test("Type Inference - simple function", () => {
  const env = inferType("let add = (x, y) => x + y");
  const scheme = env.get("add");
  assertEquals(scheme?.type.kind, "FunctionType");

  const funcType = scheme?.type as any;
  assertEquals(funcType.paramTypes.length, 2);
  assertEquals(funcType.returnType.kind, "NumberType");
});

Deno.test("Type Inference - function with explicit operations", () => {
  const env = inferType("let isEven = (n) => n % 2 == 0");
  const scheme = env.get("isEven");
  assertEquals(scheme?.type.kind, "FunctionType");

  const funcType = scheme?.type as any;
  assertEquals(funcType.paramTypes.length, 1);
  assertEquals(funcType.returnType.kind, "BooleanType");
});

Deno.test("Type Inference - higher-order function", () => {
  const env = inferType("let apply = (f, x) => f(x)");
  const scheme = env.get("apply");
  assertEquals(scheme?.type.kind, "FunctionType");

  const funcType = scheme?.type as any;
  assertEquals(funcType.paramTypes.length, 2);
  // First parameter should be a function type
  assertEquals(funcType.paramTypes[0].kind, "FunctionType");
});

// ========== Binary Operation Type Inference ==========

Deno.test("Type Inference - arithmetic operations", () => {
  const parser = new Parser("1 + 2 * 3");
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "NumberType");
});

Deno.test("Type Inference - comparison operations", () => {
  const parser = new Parser("5 > 3");
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "BooleanType");
});

Deno.test("Type Inference - logical operations", () => {
  const parser = new Parser("true && false");
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "BooleanType");
});

// ========== If Expression Type Inference ==========

Deno.test("Type Inference - if expression with else", () => {
  const parser = new Parser(`if (true) "yes" else "no"`);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "StringType");
});

Deno.test("Type Inference - if expression without else", () => {
  const parser = new Parser(`if (true) 42`);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "UnitType");
});

// ========== Block Expression Type Inference ==========

Deno.test("Type Inference - block expression", () => {
  const parser = new Parser(`{
    let x = 10;
    let y = 20;
    x + y
  }`);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  const env = new Map();
  const type = inferrer.inferExpression(firstExpression(ast), env);
  assertEquals(type.kind, "NumberType");
});

// ========== Complex Type Inference ==========

Deno.test("Type Inference - function call", () => {
  const env = inferType(`
    let add = (x, y) => x + y;
    let result = add(10, 20)
  `);

  const addScheme = env.get("add");
  assertEquals(addScheme?.type.kind, "FunctionType");

  const resultScheme = env.get("result");
  assertEquals(resultScheme?.type.kind, "NumberType");
});

Deno.test("Type Inference - nested objects", () => {
  const env = inferType(`
    let user = {
      profile: {
        name: "Alice",
        age: 25
      },
      active: true
    }
  `);

  const scheme = env.get("user");
  assertEquals(scheme?.type.kind, "ObjectType");

  const fields = (scheme?.type as any).row.fields;
  assertEquals(fields.get("profile").kind, "ObjectType");
  assertEquals(fields.get("active").kind, "BooleanType");
});

Deno.test("Type Inference - array of functions", () => {
  const env = inferType(`
    let funcs = [
      (x) => x + 1,
      (x) => x * 2,
      (x) => x - 1
    ]
  `);

  const scheme = env.get("funcs");
  assertEquals(scheme?.type.kind, "ArrayType");
  assertEquals((scheme?.type as any).elementType.kind, "FunctionType");
});

// ========== Error Cases ==========

Deno.test("Type Inference - undefined variable error", () => {
  assertThrows(
    () => {
      const parser = new Parser("unknownVar");
      const ast = parser.parse();
      const inferrer = new TypeInferrer();
      const env = new Map();
      inferrer.inferExpression(firstExpression(ast), env);
    },
    TypeError,
    "Undefined variable: unknownVar",
  );
});

Deno.test("Type Inference - type mismatch in arithmetic", () => {
  assertThrows(
    () => {
      const env = inferType(`"hello" + 42`);
      // This should fail during constraint solving
    },
    TypeError,
  );
});

Deno.test("Type Inference - mixed array types", () => {
  assertThrows(
    () => {
      const env = inferType(`[1, "hello", true]`);
      // Mixed array should fail
    },
    TypeError,
  );
});

// ========== Dictionary Type Inference ==========

Deno.test("Type Inference - string dictionary", () => {
  const env = inferType('let dict = ["name": "Alice", "city": "Tokyo"]');
  const scheme = env.get("dict");
  assertEquals(scheme?.type.kind, "DictType");
  assertEquals((scheme?.type as any).keyType.kind, "StringType");
  assertEquals((scheme?.type as any).valueType.kind, "StringType");
});

Deno.test("Type Inference - number key dictionary", () => {
  const env = inferType('let nums = [1: "one", 2: "two", 3: "three"]');
  const scheme = env.get("nums");
  assertEquals(scheme?.type.kind, "DictType");
  assertEquals((scheme?.type as any).keyType.kind, "NumberType");
  assertEquals((scheme?.type as any).valueType.kind, "StringType");
});

Deno.test("Type Inference - mixed value dictionary", () => {
  // Mixed value types in dictionaries should fail type inference
  assertThrows(
    () => inferType('let mixed = ["str": "hello", "num": 42]'),
    TypeError,
    "Cannot unify types",
  );
});

Deno.test("Type Inference - dictionary with type annotation", () => {
  // Test dictionary type annotation
  const env = inferType('let dict: [string : number] = ["a": 1, "b": 2]');
  const scheme = env.get("dict");
  assertEquals(scheme?.type.kind, "DictType");
  assertEquals((scheme?.type as any).keyType.kind, "StringType");
  assertEquals((scheme?.type as any).valueType.kind, "NumberType");
});

Deno.test("Type Inference - dictionary access", () => {
  // Dictionary access returns the value type
  const env = inferType('let dict = ["key": 42]; let val = dict["key"]');
  const scheme = env.get("val");
  assertEquals(scheme?.type.kind, "NumberType");
});

// ========== Polymorphic Type Inference ==========

Deno.test("Type Inference - polymorphic identity function", () => {
  const env = inferType("let id = (x) => x");
  const scheme = env.get("id");
  assertEquals(scheme?.type.kind, "FunctionType");

  // Should be polymorphic: forall a. a -> a
  assertEquals(scheme?.typeVars.length, 1);
});

Deno.test("Type Inference - generic function usage", () => {
  const env = inferType(`
    let id = (x) => x;
    let num = id(42);
    let str = id("hello")
  `);

  const numScheme = env.get("num");
  assertEquals(numScheme?.type.kind, "NumberType");

  const strScheme = env.get("str");
  assertEquals(strScheme?.type.kind, "StringType");
});

// ========== Advanced Cases ==========

Deno.test("Type Inference - recursive data structure", () => {
  const env = inferType(`
    let makeList = (head, tail) => {
      head: head,
      tail: tail
    }
  `);

  const scheme = env.get("makeList");
  assertEquals(scheme?.type.kind, "FunctionType");
});

Deno.test("Type Inference - curried function", () => {
  const env = inferType(`
    let add = (x) => (y) => x + y;
    let addFive = add(5);
    let result = addFive(10)
  `);

  const addScheme = env.get("add");
  assertEquals(addScheme?.type.kind, "FunctionType");

  const addFiveScheme = env.get("addFive");
  assertEquals(addFiveScheme?.type.kind, "FunctionType");

  const resultScheme = env.get("result");
  assertEquals(resultScheme?.type.kind, "NumberType");
});
