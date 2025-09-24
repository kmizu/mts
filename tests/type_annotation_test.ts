// Tests for type annotation parsing and type checking

import { Parser } from "../src/parser.ts";
import { TypeInferrer } from "../src/infer.ts";
import { Evaluator } from "../src/evaluator.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

function parseTypeAnnotation(source: string) {
  const parser = new Parser(source);
  return parser.parse();
}

function typeCheckWithAnnotation(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  return inferrer.inferAndSolve(ast);
}

function evaluateWithAnnotation(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const evaluator = new Evaluator();
  return evaluator.evaluate(ast);
}

function inferType(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  return inferrer.infer(ast);
}

function evaluate(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  inferrer.inferAndSolve(ast);
  const evaluator = new Evaluator();
  return evaluator.evaluate(ast);
}

// ========== Type Annotation Parsing Tests ==========

Deno.test("Type Annotation - basic parameter type", () => {
  const ast = parseTypeAnnotation("(x: number) => x");
  assertEquals(ast.body.length, 1);

  const func = ast.body[0] as any;
  assertEquals(func.kind, "FunctionExpression");
  assertEquals(func.parameters.length, 1);

  const param = func.parameters[0];
  assertEquals(param.kind, "Parameter");
  assertEquals(param.identifier.name, "x");
  assertEquals(param.typeAnnotation.kind, "TypeAnnotation");
  assertEquals(param.typeAnnotation.type.kind, "PrimitiveTypeExpression");
  assertEquals(param.typeAnnotation.type.primitive, "number");
});

Deno.test("Type Annotation - multiple parameters with types", () => {
  const ast = parseTypeAnnotation("(x: number, y: string) => x + y");

  const func = ast.body[0] as any;
  assertEquals(func.parameters.length, 2);

  assertEquals(func.parameters[0].identifier.name, "x");
  assertEquals(func.parameters[0].typeAnnotation.type.primitive, "number");

  assertEquals(func.parameters[1].identifier.name, "y");
  assertEquals(func.parameters[1].typeAnnotation.type.primitive, "string");
});

Deno.test("Type Annotation - mixed annotated and unannotated parameters", () => {
  const ast = parseTypeAnnotation("(x: number, y) => x + y");

  const func = ast.body[0] as any;
  assertEquals(func.parameters.length, 2);

  // First parameter has type annotation
  assertEquals(func.parameters[0].typeAnnotation.type.primitive, "number");

  // Second parameter has no type annotation
  assertEquals(func.parameters[1].typeAnnotation, undefined);
});

Deno.test("Type Annotation - return type annotation", () => {
  const ast = parseTypeAnnotation("(x: number): string => toString(x)");

  const func = ast.body[0] as any;
  assertEquals(func.returnTypeAnnotation.kind, "TypeAnnotation");
  assertEquals(func.returnTypeAnnotation.type.kind, "PrimitiveTypeExpression");
  assertEquals(func.returnTypeAnnotation.type.primitive, "string");
});

Deno.test("Type Annotation - function type expression", () => {
  const ast = parseTypeAnnotation("(f: (number) => string, x: number) => f(x)");

  const func = ast.body[0] as any;
  const fParam = func.parameters[0];

  assertEquals(fParam.typeAnnotation.type.kind, "FunctionTypeExpression");
  assertEquals(fParam.typeAnnotation.type.paramTypes.length, 1);
  assertEquals(fParam.typeAnnotation.type.paramTypes[0].primitive, "number");
  assertEquals(fParam.typeAnnotation.type.returnType.primitive, "string");
});

Deno.test("Type Annotation - all primitive types", () => {
  const primitives = ["number", "string", "boolean", "null", "undefined", "unit"];

  for (const primitive of primitives) {
    const ast = parseTypeAnnotation(`(x: ${primitive}) => x`);
    const func = ast.body[0] as any;
    assertEquals(func.parameters[0].typeAnnotation.type.primitive, primitive);
  }
});

Deno.test("Type Annotation - in variable declaration", () => {
  const ast = parseTypeAnnotation("let add = (x: number, y: number) => x + y");

  assertEquals(ast.body[0].kind, "VariableDeclaration");
  const func = (ast.body[0] as any).bindings[0].initializer as any;
  assertEquals(func.kind, "FunctionExpression");
  assertEquals(func.parameters[0].typeAnnotation.type.primitive, "number");
});

// ========== Type Checking with Annotations Tests ==========

Deno.test("Type Annotation - type checking enforces parameter types", () => {
  // This should succeed
  const env = typeCheckWithAnnotation(`
    let add = (x: number, y: number) => x + y;
    add(5, 10)
  `);

  // Check that the function has the expected type
  const addScheme = env.get("add");
  assertEquals(addScheme?.type.kind, "FunctionType");
});

Deno.test("Type Annotation - type checking enforces return types", () => {
  // This should succeed - return type matches
  typeCheckWithAnnotation(`
    let identity = (x: number): number => x;
    identity(42)
  `);

  // This should fail - return type doesn't match
  assertThrows(() => {
    typeCheckWithAnnotation(`
      let broken = (x: number): string => x;
      broken(42)
    `);
  });
});

Deno.test("Type Annotation - mixed with type inference", () => {
  const env = typeCheckWithAnnotation(`
    let process = (x: number, f) => f(x * 2);
    let double = (y) => y + y;
    process(5, double)
  `);

  // f parameter should be inferred as (number) => number
  const processScheme = env.get("process");
  assertEquals(processScheme?.type.kind, "FunctionType");
});

Deno.test("Type Annotation - function type parameters", () => {
  typeCheckWithAnnotation(`
    let apply = (f: (number) => number, x: number) => f(x);
    let square = (n: number) => n * n;
    apply(square, 5)
  `);
});

Deno.test("Type Annotation - type variable annotations", () => {
  typeCheckWithAnnotation(`
    let identity = (x: T) => x;
    identity(42)
  `);
});

// ========== Runtime Execution Tests ==========

Deno.test("Type Annotation - runtime execution with annotations", () => {
  const result = evaluateWithAnnotation(`
    let add = (x: number, y: number) => x + y;
    add(10, 20)
  `);

  assertEquals(result, 30);
});

Deno.test("Type Annotation - higher-order functions with annotations", () => {
  const result = evaluateWithAnnotation(`
    let apply = (f: (number) => number, x: number) => f(x);
    let triple = (n: number) => n * 3;
    apply(triple, 7)
  `);

  assertEquals(result, 21);
});

Deno.test("Type Annotation - return type annotations work at runtime", () => {
  const result = evaluateWithAnnotation(`
    let calculate = (x: number): number => {
      let doubled = x * 2;
      doubled + 10
    };
    calculate(5)
  `);

  assertEquals(result, 20);
});

Deno.test("Type Annotation - complex nested function types", () => {
  const result = evaluateWithAnnotation(`
    let compose = (f: (number) => number, g: (number) => number) =>
      (x: number) => f(g(x));

    let addOne = (x: number) => x + 1;
    let double = (x: number) => x * 2;

    let composed = compose(double, addOne);
    composed(5)
  `);

  assertEquals(result, 12); // (5 + 1) * 2 = 12
});

// ========== Type Annotation with Built-ins Tests ==========

Deno.test("Type Annotation - with builtin functions", () => {
  const result = evaluateWithAnnotation(`
    let processArray = (arr: T, transformer: (T) => T) =>
      push(arr, transformer(head(arr)));

    let numbers = [1, 2, 3];
    let double = (x: number) => x * 2;
    processArray(numbers, double)
  `);

  assertEquals(result, [1, 2, 3, 2]); // Added doubled first element
});

Deno.test("Type Annotation - string functions with types", () => {
  const result = evaluateWithAnnotation(`
    let formatNumber = (x: number): string => {
      let str = toString(x);
      concat("Number: ", str)
    };
    formatNumber(42)
  `);

  assertEquals(result, "Number: 42");
});

// ========== Error Cases Tests ==========

Deno.test("Type Annotation - type mismatch detection", () => {
  // This should fail during type checking
  assertThrows(() => {
    typeCheckWithAnnotation(`
      let addStrings = (x: string, y: string) => x + y;
      addStrings(42, "hello")
    `);
  });
});

Deno.test("Type Annotation - return type mismatch", () => {
  assertThrows(() => {
    typeCheckWithAnnotation(`
      let getString = (x: number): string => x;
      getString(42)
    `);
  });
});

Deno.test("Type Annotation - function parameter type mismatch", () => {
  assertThrows(() => {
    typeCheckWithAnnotation(`
      let apply = (f: (string) => string, x: string) => f(x);
      let addOne = (n: number) => n + 1;
      apply(addOne, "hello")
    `);
  });
});

// ========== Edge Cases Tests ==========

Deno.test("Type Annotation - empty parameter list with return type", () => {
  const result = evaluateWithAnnotation(`
    let getFortyTwo = (): number => 42;
    getFortyTwo()
  `);

  assertEquals(result, 42);
});

Deno.test("Type Annotation - single parameter without parentheses", () => {
  // x: number => x should NOT work (requires parentheses for type annotations)
  assertThrows(() => {
    parseTypeAnnotation("x: number => x");
  });
});

Deno.test("Type Annotation - recursive functions with annotations", () => {
  const result = evaluateWithAnnotation(`
    let factorial = (n: number): number => {
      if (n <= 1) {
        1
      } else {
        n * factorial(n - 1)
      }
    };
    factorial(4)
  `);

  assertEquals(result, 24);
});

Deno.test("Type Annotation - closures with type annotations", () => {
  const result = evaluateWithAnnotation(`
    let makeAdder = (x: number) => (y: number) => x + y;
    let add5 = makeAdder(5);
    add5(10)
  `);

  assertEquals(result, 15);
});

// ========== Array Type Annotations ==========

Deno.test("Type Annotation - Array<T> syntax", () => {
  const env = inferType(`
    let nums: Array<number> = [1, 2, 3];
    let strs: Array<string> = ["a", "b", "c"];
    nums
  `);
  const scheme = env.get("nums");
  assertEquals(scheme?.type.kind, "ArrayType");
  assertEquals((scheme?.type as any).elementType.kind, "NumberType");
});

Deno.test("Type Annotation - [T] syntax", () => {
  const env = inferType(`
    let nums: [number] = [1, 2, 3];
    let strs: [string] = ["hello", "world"];
    nums
  `);
  const scheme = env.get("nums");
  assertEquals(scheme?.type.kind, "ArrayType");
  assertEquals((scheme?.type as any).elementType.kind, "NumberType");
});

Deno.test("Type Annotation - nested arrays", () => {
  const env = inferType(`
    let matrix: Array<Array<number>> = [[1, 2], [3, 4]];
    let cube: [[[string]]] = [[["a"]]];
    matrix
  `);
  const scheme = env.get("matrix");
  assertEquals(scheme?.type.kind, "ArrayType");
  const elementType = (scheme?.type as any).elementType;
  assertEquals(elementType.kind, "ArrayType");
  assertEquals(elementType.elementType.kind, "NumberType");
});

Deno.test("Type Annotation - array type mismatch error", () => {
  assertThrows(() => {
    inferType(`
      let nums: Array<string> = [1, 2, 3];
      nums
    `);
  });
});

Deno.test("Type Annotation - array runtime execution", () => {
  const result = evaluate(`
    let nums: [number] = [1, 2, 3];
    let sum: number = nums[0] + nums[1] + nums[2];
    sum
  `);
  assertEquals(result, 6);
});
