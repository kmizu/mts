// Edge cases and stress tests for the Parser

import { Parser } from "../src/parser.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

// ========== Whitespace and Formatting Tests ==========

Deno.test("Parser - weird whitespace formatting", () => {
  const parser = new Parser(`
    
    
    let    x   =    42   ;
    
    
    let     y    =     "hello"    ;
    
    
    x    +    1
    
    
  `);
  const ast = parser.parse();

  assertEquals(ast.body.length, 3);
  assertEquals(ast.body[0].kind, "VariableDeclaration");
  assertEquals(ast.body[1].kind, "VariableDeclaration");
  assertEquals(ast.body[2].kind, "BinaryExpression");
});

Deno.test("Parser - no whitespace", () => {
  const parser = new Parser('let x=42;let y="hello";x+1');
  const ast = parser.parse();

  assertEquals(ast.body.length, 3);
  assertEquals((ast.body[0] as any).bindings[0].identifier.name, "x");
  assertEquals((ast.body[1] as any).bindings[0].identifier.name, "y");
});

Deno.test("Parser - single quotes not supported", () => {
  // Our lexer only supports double quotes for now
  assertThrows(
    () => new Parser(`'hello world'`).parse(),
    Error,
    "Unexpected character: '",
  );
});

// ========== Large and Complex Expressions ==========

Deno.test("Parser - deeply nested parentheses", () => {
  const parser = new Parser("((((((1 + 2) * 3) - 4) / 5) + 6) * 7)");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BinaryExpression");
  // Should parse correctly without stack overflow
});

Deno.test("Parser - very long function chain", () => {
  const source = "f" + Array(20).fill("(x)").join("") + Array(20).fill("(y)").join("");
  const parser = new Parser(source);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "CallExpression");
  // Should handle long chains without issues
});

Deno.test("Parser - large array", () => {
  const elements = Array(100).fill(0).map((_, i) => i.toString()).join(", ");
  const parser = new Parser(`[${elements}]`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ArrayExpression");
  assertEquals((ast.body[0] as any).elements.length, 100);
});

Deno.test("Parser - large object", () => {
  const props = Array(50).fill(0).map((_, i) => `prop${i}: ${i}`).join(", ");
  const parser = new Parser(`{ ${props} }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  assertEquals((ast.body[0] as any).properties.length, 50);
});

// ========== Corner Cases ==========

Deno.test("Parser - single character identifiers", () => {
  const parser = new Parser("let a = b + c - d * e / f");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "VariableDeclaration");
  const expr = (ast.body[0] as any).bindings[0].initializer;
  assertEquals(expr.kind, "BinaryExpression");
});

Deno.test("Parser - string keys for reserved words", () => {
  const parser = new Parser(`{
    "let": "keyword1",
    "if": "keyword2",
    "else": "keyword3",
    "match": "keyword4"
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  const props = (ast.body[0] as any).properties;
  assertEquals(props[0].key, "let");
  assertEquals(props[1].key, "if");
  assertEquals(props[2].key, "else");
  assertEquals(props[3].key, "match");
});

Deno.test("Parser - numbers with different formats", () => {
  const parser = new Parser("0 1 123 0.5 3.14159 42.0");
  const ast = parser.parse();

  assertEquals(ast.body.length, 6);
  assertEquals((ast.body[0] as any).value, 0);
  assertEquals((ast.body[1] as any).value, 1);
  assertEquals((ast.body[2] as any).value, 123);
  assertEquals((ast.body[3] as any).value, 0.5);
  assertEquals((ast.body[4] as any).value, 3.14159);
  assertEquals((ast.body[5] as any).value, 42.0);
});

Deno.test("Parser - function with undefined body", () => {
  const parser = new Parser("() => undefined");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "FunctionExpression");
  const func = ast.body[0] as any;
  assertEquals(func.body.kind, "UndefinedLiteral");
});

// ========== Expression Statement Edge Cases ==========

Deno.test("Parser - semicolon handling", () => {
  const parser = new Parser("42;");
  const ast = parser.parse();

  assertEquals(ast.body.length, 1);
  assertEquals(ast.body[0].kind, "NumberLiteral");
});

Deno.test("Parser - expression vs statement disambiguation", () => {
  const parser = new Parser(`{
    42;
    "hello";
    true
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BlockExpression");
  const block = ast.body[0] as any;
  assertEquals(block.statements.length, 2);
  assertEquals(block.expression.kind, "BooleanLiteral");
});

// ========== Match Pattern Edge Cases ==========

Deno.test("Parser - match with all pattern types", () => {
  const parser = new Parser(`
    match value {
      42 => "number",
      "hello" => "string", 
      true => "boolean",
      null => "null",
      identifier => "variable",
      _ => "wildcard"
    }
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "MatchExpression");
  const match = ast.body[0] as any;
  assertEquals(match.cases.length, 6);
  assertEquals(match.cases[0].pattern.kind, "LiteralPattern");
  assertEquals(match.cases[1].pattern.kind, "LiteralPattern");
  assertEquals(match.cases[2].pattern.kind, "LiteralPattern");
  assertEquals(match.cases[3].pattern.kind, "LiteralPattern");
  assertEquals(match.cases[4].pattern.kind, "IdentifierPattern");
  assertEquals(match.cases[5].pattern.kind, "WildcardPattern");
});

// ========== Function Parameter Edge Cases ==========

Deno.test("Parser - function with many parameters", () => {
  const params = Array(20).fill(0).map((_, i) => `param${i}`).join(", ");
  const parser = new Parser(`(${params}) => param0 + param1`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "FunctionExpression");
  const func = ast.body[0] as any;
  assertEquals(func.parameters.length, 20);
});

// ========== Recursive Structure Tests ==========

Deno.test("Parser - recursive object structure", () => {
  const parser = new Parser(`{
    value: 1,
    child: {
      value: 2,
      child: {
        value: 3,
        child: null
      }
    }
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  const obj = ast.body[0] as any;
  assertEquals(obj.properties[1].value.kind, "ObjectExpression");
  assertEquals(obj.properties[1].value.properties[1].value.kind, "ObjectExpression");
});

Deno.test("Parser - recursive function calls", () => {
  const parser = new Parser("factorial(factorial(factorial(5)))");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "CallExpression");
  const outer = ast.body[0] as any;
  assertEquals(outer.arguments[0].kind, "CallExpression");
  assertEquals(outer.arguments[0].arguments[0].kind, "CallExpression");
});

// ========== Unicode and Special Characters ==========

Deno.test("Parser - unicode in string literals", () => {
  const parser = new Parser(`"こんにちは世界" ; "Hello 🌍" ; "café"`);
  const ast = parser.parse();

  assertEquals(ast.body.length, 3);
  assertEquals((ast.body[0] as any).value, "こんにちは世界");
  assertEquals((ast.body[1] as any).value, "Hello 🌍");
  assertEquals((ast.body[2] as any).value, "café");
});

Deno.test("Parser - unicode not supported in identifiers", () => {
  // Our lexer only supports ASCII identifiers for now
  assertThrows(
    () => new Parser("let café = 42").parse(),
    Error,
    "Unexpected character: é",
  );
});

// ========== Error Recovery Tests ==========

Deno.test("Parser - multiple syntax errors", () => {
  assertThrows(() => {
    new Parser("let = = = 42").parse();
  });

  assertThrows(() => {
    new Parser("((((((").parse();
  });

  assertThrows(() => {
    new Parser("{ { { {").parse();
  });
});

// ========== Performance Stress Tests ==========

Deno.test("Parser - many binary operations", () => {
  // Create a long chain of additions: 1 + 1 + 1 + ... (100 times)
  const expr = Array(100).fill("1").join(" + ");
  const parser = new Parser(expr);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BinaryExpression");
  // Should complete in reasonable time
});

Deno.test("Parser - moderately nested expressions", () => {
  // Create nested structure: (((1)))
  const nested = "(((1)))";
  const parser = new Parser(nested);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "NumberLiteral");
  assertEquals((ast.body[0] as any).value, 1);
});

// ========== Real-world Code Examples ==========

Deno.test("Parser - fibonacci function", () => {
  const parser = new Parser(`
    let fibonacci = (n) => {
      if (n <= 1) {
        n
      } else {
        fibonacci(n - 1) + fibonacci(n - 2)
      }
    }
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "VariableDeclaration");
  const fib = ast.body[0] as any;
  assertEquals(fib.bindings[0].identifier.name, "fibonacci");
  assertEquals(fib.bindings[0].initializer.kind, "FunctionExpression");
});

Deno.test("Parser - quicksort function", () => {
  const parser = new Parser(`
    let quicksort = (arr) => {
      if (length(arr) <= 1) {
        arr
      } else {
        let pivot = arr[0];
        let less = filter(tail(arr), (x) => x < pivot);
        let greater = filter(tail(arr), (x) => x >= pivot);
        concat(
          concat(quicksort(less), [pivot]),
          quicksort(greater)
        )
      }
    }
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "VariableDeclaration");
  const qs = ast.body[0] as any;
  assertEquals(qs.bindings[0].identifier.name, "quicksort");
  assertEquals(qs.bindings[0].initializer.kind, "FunctionExpression");
});

Deno.test("Parser - data processing pipeline", () => {
  const parser = new Parser(`
    let result = pipe(
      data,
      (x) => filter(x, (item) => item.active),
      (x) => map(x, (item) => {
        name: item.name,
        score: item.score * 2
      }),
      (x) => sort(x, (a, b) => b.score - a.score),
      (x) => take(x, 10)
    )
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "VariableDeclaration");
  const result = ast.body[0] as any;
  assertEquals(result.bindings[0].initializer.kind, "CallExpression");
  assertEquals(result.bindings[0].initializer.callee.name, "pipe");
});
