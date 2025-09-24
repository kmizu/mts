// Edge case tests for Type Inference (focused on currently supported features)

import { TypeError, TypeInferrer } from "../src/infer.ts";
import { Parser } from "../src/parser.ts";
import { typeToString } from "../src/types.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

function inferType(source: string) {
  const parser = new Parser(source);
  const ast = parser.parse();
  const inferrer = new TypeInferrer();
  return inferrer.inferAndSolve(ast);
}

// ========== Complex Polymorphic Types ==========

Deno.test("Type Inference - complex polymorphic function", () => {
  const env = inferType(`
    let compose = (f, g) => (x) => f(g(x));
    let addOne = (x) => x + 1;
    let double = (x) => x * 2;
    let addOneAndDouble = compose(double, addOne)
  `);

  const composeScheme = env.get("compose");
  const resultScheme = env.get("addOneAndDouble");
  assertEquals(composeScheme?.type.kind, "FunctionType");
  assertEquals(resultScheme?.type.kind, "FunctionType");
});

Deno.test("Type Inference - let polymorphism with multiple uses", () => {
  const env = inferType(`
    let id = (x) => x;
    let num = id(42);
    let str = id("hello");
    let bool = id(true)
  `);

  assertEquals(env.get("num")?.type.kind, "NumberType");
  assertEquals(env.get("str")?.type.kind, "StringType");
  assertEquals(env.get("bool")?.type.kind, "BooleanType");
});

// ========== Higher-Order Function Edge Cases ==========

Deno.test("Type Inference - function returning different types error", () => {
  assertThrows(
    () => {
      inferType(`
        let problematic = (flag) => {
          if (flag) {
            (x) => x + 1
          } else {
            (x) => "string"
          }
        }
      `);
    },
    TypeError,
  );
});

Deno.test("Type Inference - nested function scoping", () => {
  const env = inferType(`
    let outer = (x) => {
      let inner = (y) => x + y;
      inner
    };
    let addFive = outer(5);
    let result = addFive(10)
  `);

  const outerScheme = env.get("outer");
  const resultScheme = env.get("result");
  assertEquals(outerScheme?.type.kind, "FunctionType");
  assertEquals(resultScheme?.type.kind, "NumberType");
});

Deno.test("Type Inference - function with captured variables", () => {
  const env = inferType(`
    let makeCounter = () => {
      let count = 0;
      (increment) => count + increment
    };
    let counter = makeCounter();
    let result = counter(5)
  `);

  const counterScheme = env.get("counter");
  const resultScheme = env.get("result");
  assertEquals(counterScheme?.type.kind, "FunctionType");
  assertEquals(resultScheme?.type.kind, "NumberType");
});

// ========== Object Type Edge Cases ==========

Deno.test("Type Inference - object field access chain", () => {
  const env = inferType(`
    let obj = {
      a: {
        b: {
          c: 42
        }
      }
    };
    let value = obj.a.b.c
  `);

  const valueScheme = env.get("value");
  assertEquals(valueScheme?.type.kind, "NumberType");
});

Deno.test("Type Inference - object with function fields", () => {
  const env = inferType(`
    let math = {
      add: (x, y) => x + y,
      mul: (x, y) => x * y
    };
    let sum = math.add(5, 3)
  `);

  assertEquals(env.get("sum")?.type.kind, "NumberType");
});

// ========== Array Type Edge Cases ==========

Deno.test("Type Inference - nested arrays", () => {
  const env = inferType(`
    let matrix = [[1, 2], [3, 4], [5, 6]];
    let first_row = matrix[0];
    let first_element = first_row[0]
  `);

  const matrixScheme = env.get("matrix");
  assertEquals(matrixScheme?.type.kind, "ArrayType");
  assertEquals((matrixScheme?.type as any).elementType.kind, "ArrayType");

  const firstRowScheme = env.get("first_row");
  assertEquals(firstRowScheme?.type.kind, "ArrayType");

  const firstElementScheme = env.get("first_element");
  assertEquals(firstElementScheme?.type.kind, "NumberType");
});

Deno.test("Type Inference - array of objects", () => {
  const env = inferType(`
    let users = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 }
    ];
    let first_user = users[0]
  `);

  const usersScheme = env.get("users");
  assertEquals(usersScheme?.type.kind, "ArrayType");
  assertEquals((usersScheme?.type as any).elementType.kind, "ObjectType");

  const firstUserScheme = env.get("first_user");
  assertEquals(firstUserScheme?.type.kind, "ObjectType");
});

Deno.test("Type Inference - heterogeneous array error", () => {
  assertThrows(
    () => {
      inferType(`let mixed = [1, "hello", true]`);
    },
    TypeError,
  );
});

// ========== Control Flow Edge Cases ==========

Deno.test("Type Inference - complex if expressions", () => {
  const env = inferType(`
    let complex_if = (x, y) => {
      if (x > 0) {
        if (y > 0) {
          x + y
        } else {
          x - y
        }
      } else {
        if (y > 0) {
          y - x
        } else {
          0
        }
      }
    }
  `);

  const scheme = env.get("complex_if");
  assertEquals(scheme?.type.kind, "FunctionType");
  assertEquals((scheme?.type as any).returnType.kind, "NumberType");
});

Deno.test("Type Inference - if with different branch types error", () => {
  assertThrows(
    () => {
      inferType(`
        let bad_if = (flag) => {
          if (flag) {
            42
          } else {
            "hello"
          }
        }
      `);
    },
    TypeError,
  );
});

// ========== Match Expression Edge Cases ==========

Deno.test("Type Inference - match with different result types error", () => {
  assertThrows(
    () => {
      inferType(`
        let bad_match = (x) => {
          match x {
            0 => "zero",
            1 => 1,
            _ => "other"
          }
        }
      `);
    },
    TypeError,
  );
});

Deno.test("Type Inference - match with guards", () => {
  const env = inferType(`
    let classify = (n) => {
      match n {
        x if x < 0 => "negative",
        0 => "zero",
        x if x > 100 => "large",
        _ => "positive"
      }
    }
  `);

  const scheme = env.get("classify");
  assertEquals(scheme?.type.kind, "FunctionType");
  assertEquals((scheme?.type as any).returnType.kind, "StringType");
});

// ========== Occurs Check and Infinite Types ==========

Deno.test("Type Inference - occurs check prevention", () => {
  assertThrows(
    () => {
      // This should trigger occurs check
      inferType(`
        let infinite = (f) => f(f)
      `);
    },
    TypeError,
    "Occurs check failed",
  );
});

Deno.test("Type Inference - self-referential object error", () => {
  assertThrows(
    () => {
      // This might cause occurs check depending on implementation
      inferType(`
        let selfRef = { self: selfRef }
      `);
    },
    TypeError,
  );
});

// ========== Type Variable Constraints ==========

Deno.test("Type Inference - type variable constraints", () => {
  const env = inferType(`
    let constrain = (x, y) => {
      let result = x + y;
      result
    };
    let test = constrain(5, 10)
  `);

  const constrainScheme = env.get("constrain");
  const testScheme = env.get("test");
  assertEquals(constrainScheme?.type.kind, "FunctionType");
  assertEquals(testScheme?.type.kind, "NumberType");
});

Deno.test("Type Inference - implicit type constraints from operations", () => {
  const env = inferType(`
    let mystery = (a, b) => {
      let sum = a + b;          // constrains a, b to number
      let comparison = a > b;    // reinforces number constraint
      let logical = comparison && (sum > 0);
      logical
    }
  `);

  const scheme = env.get("mystery");
  assertEquals(scheme?.type.kind, "FunctionType");
  const funcType = scheme?.type as any;
  assertEquals(funcType.paramTypes[0].kind, "NumberType");
  assertEquals(funcType.paramTypes[1].kind, "NumberType");
  assertEquals(funcType.returnType.kind, "BooleanType");
});

// ========== Curried Function Composition ==========

Deno.test("Type Inference - curried function composition", () => {
  const env = inferType(`
    let curry2 = (f) => (x) => (y) => f(x, y);
    let add = (x, y) => x + y;
    let curriedAdd = curry2(add);
    let add5 = curriedAdd(5);
    let result = add5(10)
  `);

  const curry2Scheme = env.get("curry2");
  const resultScheme = env.get("result");
  assertEquals(curry2Scheme?.type.kind, "FunctionType");
  assertEquals(resultScheme?.type.kind, "NumberType");
});

// ========== Performance and Stress Tests ==========

Deno.test("Type Inference - deeply nested function calls", () => {
  const env = inferType(`
    let f1 = (x) => x + 1;
    let f2 = (x) => f1(f1(x));
    let f3 = (x) => f2(f2(x));
    let f4 = (x) => f3(f3(x));
    let result = f4(0)
  `);

  const resultScheme = env.get("result");
  assertEquals(resultScheme?.type.kind, "NumberType");
});

// ========== Edge Cases with Mixed Operations ==========

Deno.test("Type Inference - mixed arithmetic and comparison", () => {
  const env = inferType(`
    let complex_expr = (x, y, z) => {
      let sum = x + y;
      let is_greater = sum > z;
      let result = if (is_greater) {
        sum * 2
      } else {
        z - sum
      };
      result
    }
  `);

  const scheme = env.get("complex_expr");
  assertEquals(scheme?.type.kind, "FunctionType");
  assertEquals((scheme?.type as any).returnType.kind, "NumberType");
});

Deno.test("Type Inference - chained logical operations", () => {
  const env = inferType(`
    let logic_chain = (a, b, c, d) => {
      (a > 0) && (b < 10) || (c == 5) && (d != 0)
    }
  `);

  const scheme = env.get("logic_chain");
  assertEquals(scheme?.type.kind, "FunctionType");
  assertEquals((scheme?.type as any).returnType.kind, "BooleanType");
});

// ========== Type Unification Edge Cases ==========

Deno.test("Type Inference - complex function parameter unification", () => {
  const env = inferType(`
    let apply_twice = (f, x) => f(f(x));
    let increment = (n) => n + 1;
    let result = apply_twice(increment, 5)
  `);

  const applyTwiceScheme = env.get("apply_twice");
  const resultScheme = env.get("result");
  assertEquals(applyTwiceScheme?.type.kind, "FunctionType");
  assertEquals(resultScheme?.type.kind, "NumberType");
});

Deno.test("Type Inference - unification with multiple constraints", () => {
  const env = inferType(`
    let transform = (x, y, z) => {
      let a = x + y;    // x, y must be number
      let b = a * z;    // z must be number
      let c = b > 0;    // result is boolean
      c
    }
  `);

  const scheme = env.get("transform");
  assertEquals(scheme?.type.kind, "FunctionType");
  const funcType = scheme?.type as any;
  assertEquals(funcType.paramTypes[0].kind, "NumberType");
  assertEquals(funcType.paramTypes[1].kind, "NumberType");
  assertEquals(funcType.paramTypes[2].kind, "NumberType");
  assertEquals(funcType.returnType.kind, "BooleanType");
});

// ========== Error Cases with Better Messages ==========

Deno.test("Type Inference - clear error for function arity mismatch", () => {
  assertThrows(
    () => {
      inferType(`
        let add2 = (x, y) => x + y;
        let result = add2(5)  // Too few arguments
      `);
    },
    TypeError,
    "Function arity mismatch",
  );
});

Deno.test("Type Inference - clear error for object field mismatch", () => {
  assertThrows(
    () => {
      inferType(`
        let getX = (obj) => obj.x;
        let noX = { y: 42 };
        let value = getX(noX)  // Missing field x
      `);
    },
    TypeError,
    "missing fields",
  );
});

// ========== Advanced Polymorphism Cases ==========

Deno.test("Type Inference - polymorphic identity separate", () => {
  const env = inferType(`
    let id = (x) => x;
    let n = id(42);
    let s = id("hello")
  `);

  assertEquals(env.get("n")?.type.kind, "NumberType");
  assertEquals(env.get("s")?.type.kind, "StringType");
});

Deno.test("Type Inference - polymorphic function with constraints", () => {
  const env = inferType(`
    let pair = (x, y) => { first: x, second: y };
    let numPair = pair(1, 2);
    let mixedPair = pair("hello", 42);
    let firstNum = numPair.first;
    let secondStr = mixedPair.first
  `);

  assertEquals(env.get("firstNum")?.type.kind, "NumberType");
  assertEquals(env.get("secondStr")?.type.kind, "StringType");
});

// ========== Complex Nested Structures ==========

Deno.test("Type Inference - nested function returns", () => {
  const env = inferType(`
    let makeAdder = (x) => {
      let adder = (y) => {
        let result = (z) => x + y + z;
        result
      };
      adder
    };
    let add5 = makeAdder(5);
    let add5and3 = add5(3);
    let final = add5and3(2)
  `);

  const finalScheme = env.get("final");
  assertEquals(finalScheme?.type.kind, "NumberType");
});
