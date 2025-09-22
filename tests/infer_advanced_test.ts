// Advanced and edge case tests for Type Inference

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

// ========== Recursive Type Inference ==========

Deno.test("Type Inference - recursive function", () => {
  const env = inferType(`
    let factorial = (n) => {
      if (n <= 1) {
        1
      } else {
        n * factorial(n - 1)
      }
    }
  `);

  const scheme = env.get("factorial");
  assertEquals(scheme?.type.kind, "FunctionType");
  assertEquals((scheme?.type as any).paramTypes[0].kind, "NumberType");
  assertEquals((scheme?.type as any).returnType.kind, "NumberType");
});

Deno.test.ignore("Type Inference - mutually recursive functions", () => {
  const env = inferType(`
    let isEven = (n) => {
      if (n == 0) {
        true
      } else {
        isOdd(n - 1)
      }
    };
    let isOdd = (n) => {
      if (n == 0) {
        false
      } else {
        isEven(n - 1)
      }
    }
  `);

  const evenScheme = env.get("isEven");
  const oddScheme = env.get("isOdd");
  assertEquals(evenScheme?.type.kind, "FunctionType");
  assertEquals(oddScheme?.type.kind, "FunctionType");
});

// ========== Complex Polymorphic Types ==========

Deno.test("Type Inference - polymorphic list functions", () => {
  const env = inferType(`
    let head = (arr) => arr[0];
    let tail = (arr) => []; // simplified tail
    let map = (arr, f) => {
      if (length(arr) == 0) {
        []
      } else {
        [f(head(arr))]
      }
    }
  `);

  const headScheme = env.get("head");
  const mapScheme = env.get("map");
  assertEquals(headScheme?.type.kind, "FunctionType");
  assertEquals(mapScheme?.type.kind, "FunctionType");
});

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

// ========== Let Polymorphism Edge Cases ==========

Deno.test("Type Inference - let polymorphism with multiple uses", () => {
  const env = inferType(`
    let id = (x) => x;
    let num = id(42);
    let str = id("hello");
    let bool = id(true);
    let arr = id([1, 2, 3])
  `);

  assertEquals(env.get("num")?.type.kind, "NumberType");
  assertEquals(env.get("str")?.type.kind, "StringType");
  assertEquals(env.get("bool")?.type.kind, "BooleanType");
  assertEquals(env.get("arr")?.type.kind, "ArrayType");
});

Deno.test("Type Inference - let polymorphism restriction", () => {
  // This should fail: function parameters are monomorphic
  assertThrows(
    () => {
      inferType(`
        let id = (x) => x;
        let test = (f) => {
          let n = f(42);
          let s = f("hello");
          n
        }
      `);
    },
    TypeError,
    "Cannot unify types",
  );
});

// ========== Higher-Order Function Edge Cases ==========

Deno.test("Type Inference - function returning different types", () => {
  assertThrows(
    () => {
      inferType(`
        let problematic = (flag) => {
          if (flag) {
            (x) => x + 1
          } else {
            (x) => x + "!"
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
      mul: (x, y) => x * y,
      identity: (x) => x
    };
    let sum = math.add(5, 3);
    let product = math.mul(4, 7);
    let same = math.identity("test")
  `);

  assertEquals(env.get("sum")?.type.kind, "NumberType");
  assertEquals(env.get("product")?.type.kind, "NumberType");
  assertEquals(env.get("same")?.type.kind, "StringType");
});

Deno.test("Type Inference - structural typing compatibility", () => {
  const env = inferType(`
    let getX = (obj) => obj.x;
    let point2d = { x: 1, y: 2 };
    let point3d = { x: 1, y: 2, z: 3 };
    let x1 = getX(point2d);
    let x2 = getX(point3d)
  `);

  assertEquals(env.get("x1")?.type.kind, "NumberType");
  assertEquals(env.get("x2")?.type.kind, "NumberType");
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
    let first_user = users[0];
    let first_name = first_user.name
  `);

  const usersScheme = env.get("users");
  assertEquals(usersScheme?.type.kind, "ArrayType");
  assertEquals((usersScheme?.type as any).elementType.kind, "ObjectType");

  const firstNameScheme = env.get("first_name");
  assertEquals(firstNameScheme?.type.kind, "StringType");
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

// ========== Variable Scope Edge Cases ==========

Deno.test.ignore("Type Inference - variable shadowing", () => {
  const env = inferType(`
    let x = 42;
    let test = {
      let x = "hello";
      let y = x + " world";
      y
    };
    let original = x
  `);

  const testScheme = env.get("test");
  const originalScheme = env.get("original");
  assertEquals(testScheme?.type.kind, "StringType");
  assertEquals(originalScheme?.type.kind, "NumberType");
});

Deno.test.ignore("Type Inference - block scoping", () => {
  const env = inferType(`
    let outer = 42;
    let result = {
      let inner = "hello";
      let combined = {
        let deep = true;
        if (deep) {
          inner + " world"
        } else {
          "bye"
        }
      };
      combined
    }
  `);

  const resultScheme = env.get("result");
  assertEquals(resultScheme?.type.kind, "StringType");
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

// ========== Error Recovery and Occurs Check ==========

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

// ========== Complex Real-World Scenarios ==========

Deno.test.ignore("Type Inference - functional programming patterns", () => {
  const env = inferType(`
    let fold = (arr, init, f) => {
      if (length(arr) == 0) {
        init
      } else {
        fold(tail(arr), f(init, head(arr)), f)
      }
    };
    let sum = (arr) => fold(arr, 0, (acc, x) => acc + x);
    let concat_strings = (arr) => fold(arr, "", (acc, x) => acc + x)
  `);

  const foldScheme = env.get("fold");
  const sumScheme = env.get("sum");
  const concatScheme = env.get("concat_strings");

  assertEquals(foldScheme?.type.kind, "FunctionType");
  assertEquals(sumScheme?.type.kind, "FunctionType");
  assertEquals(concatScheme?.type.kind, "FunctionType");
});

Deno.test.ignore("Type Inference - data structure with methods", () => {
  const env = inferType(`
    let makeStack = () => {
      items: [],
      push: (item) => {
        // simplified push implementation
        item
      },
      pop: () => {
        // simplified pop implementation  
        42
      },
      isEmpty: () => length(items) == 0
    };
    let stack = makeStack();
    let pushed = stack.push("hello");
    let popped = stack.pop()
  `);

  const stackScheme = env.get("stack");
  assertEquals(stackScheme?.type.kind, "ObjectType");
});

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

Deno.test("Type Inference - complex object hierarchy", () => {
  const env = inferType(`
    let complex = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 42,
              func: (x) => x * 2
            }
          }
        }
      }
    };
    let deep_value = complex.level1.level2.level3.level4.value;
    let deep_func = complex.level1.level2.level3.level4.func;
    let computed = deep_func(deep_value)
  `);

  assertEquals(env.get("deep_value")?.type.kind, "NumberType");
  assertEquals(env.get("deep_func")?.type.kind, "FunctionType");
  assertEquals(env.get("computed")?.type.kind, "NumberType");
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

// ========== Unification Edge Cases ==========

Deno.test.ignore("Type Inference - complex unification scenario", () => {
  const env = inferType(`
    let mystery = (f, g, x) => {
      let result1 = f(x);
      let result2 = g(result1);
      result2
    };
    let double = (n) => n * 2;
    let toString = (n) => "number: " + n;
    let test = mystery(double, toString, 21)
  `);

  const mysteryScheme = env.get("mystery");
  const testScheme = env.get("test");
  assertEquals(mysteryScheme?.type.kind, "FunctionType");
  assertEquals(testScheme?.type.kind, "StringType");
});
