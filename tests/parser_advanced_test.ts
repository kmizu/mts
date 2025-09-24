// Advanced tests for the Parser

import { Parser } from "../src/parser.ts";
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

// ========== Nested Expressions Tests ==========

Deno.test("Parser - deeply nested arithmetic", () => {
  const parser = new Parser("((1 + 2) * (3 - 4)) / (5 + 6)");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BinaryExpression");
  const root = ast.body[0] as any;
  assertEquals(root.operator, "/");
  assertEquals(root.left.kind, "BinaryExpression");
  assertEquals(root.left.operator, "*");
  assertEquals(root.right.kind, "BinaryExpression");
  assertEquals(root.right.operator, "+");
});

Deno.test("Parser - nested function calls", () => {
  const parser = new Parser("add(multiply(2, 3), subtract(10, 5))");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "CallExpression");
  const call = ast.body[0] as any;
  assertEquals(call.callee.name, "add");
  assertEquals(call.arguments.length, 2);
  assertEquals(call.arguments[0].kind, "CallExpression");
  assertEquals(call.arguments[1].kind, "CallExpression");
});

Deno.test("Parser - chained member access", () => {
  const parser = new Parser("person.address.city.name");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "MemberExpression");
  const member1 = ast.body[0] as any;
  assertEquals(member1.property, "name");
  assertEquals(member1.object.kind, "MemberExpression");

  const member2 = member1.object;
  assertEquals(member2.property, "city");
  assertEquals(member2.object.kind, "MemberExpression");

  const member3 = member2.object;
  assertEquals(member3.property, "address");
  assertEquals(member3.object.kind, "Identifier");
  assertEquals(member3.object.name, "person");
});

Deno.test("Parser - mixed member and index access", () => {
  const parser = new Parser("users[0].friends[1].name");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "MemberExpression");
  const top = ast.body[0] as any;
  assertEquals(top.property, "name");

  const friendsIndex = top.object;
  assertEquals(friendsIndex.kind, "IndexExpression");
  assertEquals(friendsIndex.index.value, 1);

  const friends = friendsIndex.array;
  assertEquals(friends.kind, "MemberExpression");
  assertEquals(friends.property, "friends");
});

// ========== Complex Function Tests ==========

Deno.test("Parser - higher-order function", () => {
  const parser = new Parser("map(numbers, (x) => x * 2)");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "CallExpression");
  const call = ast.body[0] as any;
  assertEquals(call.arguments[1].kind, "FunctionExpression");

  const lambda = call.arguments[1];
  assertEquals(lambda.parameters.length, 1);
  assertEquals(lambda.body.kind, "BinaryExpression");
});

Deno.test("Parser - immediately invoked function expression (IIFE)", () => {
  const parser = new Parser("((x, y) => x + y)(10, 20)");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "CallExpression");
  const call = ast.body[0] as any;
  assertEquals(call.callee.kind, "FunctionExpression");
  assertEquals(call.arguments.length, 2);
  assertEquals(call.arguments[0].value, 10);
  assertEquals(call.arguments[1].value, 20);
});

Deno.test("Parser - function returning function", () => {
  const parser = new Parser("(x) => (y) => x + y");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "FunctionExpression");
  const outer = ast.body[0] as any;
  assertEquals(outer.parameters[0].identifier.name, "x");
  assertEquals(outer.body.kind, "FunctionExpression");

  const inner = outer.body;
  assertEquals(inner.parameters[0].identifier.name, "y");
  assertEquals(inner.body.kind, "BinaryExpression");
});

Deno.test("Parser - empty parameter function", () => {
  const parser = new Parser("() => 42");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "FunctionExpression");
  const func = ast.body[0] as any;
  assertEquals(func.parameters.length, 0);
  assertEquals(func.body.value, 42);
});

// ========== Array and Object Tests ==========

Deno.test("Parser - nested arrays", () => {
  const parser = new Parser("[[1, 2], [3, 4], [5, 6]]");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ArrayExpression");
  const arr = ast.body[0] as any;
  assertEquals(arr.elements.length, 3);
  assertEquals(arr.elements[0].kind, "ArrayExpression");
  assertEquals(arr.elements[0].elements[0].value, 1);
  assertEquals(arr.elements[2].elements[1].value, 6);
});

Deno.test("Parser - empty array", () => {
  const parser = new Parser("[]");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ArrayExpression");
  const arr = ast.body[0] as any;
  assertEquals(arr.elements.length, 0);
});

Deno.test("Parser - nested objects", () => {
  const parser = new Parser(`{
    user: {
      name: "John",
      age: 30
    },
    active: true
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  const obj = ast.body[0] as any;
  assertEquals(obj.properties.length, 2);
  assertEquals(obj.properties[0].key, "user");
  assertEquals(obj.properties[0].value.kind, "ObjectExpression");

  const nested = obj.properties[0].value;
  assertEquals(nested.properties[0].key, "name");
  assertEquals(nested.properties[1].key, "age");
});

Deno.test("Parser - empty object", () => {
  const parser = new Parser("{}");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  const obj = ast.body[0] as any;
  assertEquals(obj.properties.length, 0);
});

Deno.test("Parser - object with string keys", () => {
  const parser = new Parser(`{ "hello world": 42, "foo-bar": true }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  const obj = ast.body[0] as any;
  assertEquals(obj.properties[0].key, "hello world");
  assertEquals(obj.properties[1].key, "foo-bar");
});

// ========== If Expression Tests ==========

Deno.test("Parser - nested if expressions", () => {
  const parser = new Parser(`
    if (x > 10)
      if (x > 20) "huge" else "big"
    else
      "small"
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "IfExpression");
  const outer = ast.body[0] as any;
  assertEquals(outer.thenBranch.kind, "IfExpression");
  assertEquals(outer.elseBranch.value, "small");

  const inner = outer.thenBranch;
  assertEquals(inner.thenBranch.value, "huge");
  assertEquals(inner.elseBranch.value, "big");
});

Deno.test("Parser - if without else", () => {
  const parser = new Parser(`if (x > 0) "positive"`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "IfExpression");
  const ifExpr = ast.body[0] as any;
  assertEquals(ifExpr.elseBranch, null);
  assertEquals(ifExpr.thenBranch.value, "positive");
});

// ========== Block Expression Tests ==========

Deno.test("Parser - nested blocks", () => {
  const parser = new Parser(`{
    let x = {
      let y = 10;
      y * 2
    };
    x + 5
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BlockExpression");
  const outer = ast.body[0] as any;
  assertEquals(outer.statements.length, 1);
  assertEquals(outer.statements[0].kind, "LetStatement");

  const innerBlock = outer.statements[0].bindings[0].initializer;
  assertEquals(innerBlock.kind, "BlockExpression");
  assertEquals(innerBlock.statements.length, 1);
  assertEquals(innerBlock.expression.kind, "BinaryExpression");
});

Deno.test("Parser - block with only expression", () => {
  const parser = new Parser("{ 42 }");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BlockExpression");
  const block = ast.body[0] as any;
  assertEquals(block.statements.length, 0);
  assertEquals(block.expression.value, 42);
});

Deno.test("Parser - block with multiple statements", () => {
  const parser = new Parser(`{
    let a = 1;
    let b = 2;
    let c = 3;
    a + b + c
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BlockExpression");
  const block = ast.body[0] as any;
  assertEquals(block.statements.length, 3);
  assertEquals(block.expression.kind, "BinaryExpression");
});

// ========== Match Expression Tests ==========

Deno.test("Parser - match with guard conditions", () => {
  const parser = new Parser(`
    match x {
      n if n > 10 => "big",
      n if n > 0 => "positive",
      0 => "zero",
      _ => "negative"
    }
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "MatchExpression");
  const match = ast.body[0] as any;
  assertEquals(match.cases.length, 4);
  assertEquals(match.cases[0].guard.kind, "BinaryExpression");
  assertEquals(match.cases[1].guard.kind, "BinaryExpression");
  assertEquals(match.cases[2].guard, undefined);
});

Deno.test("Parser - match with variable patterns", () => {
  const parser = new Parser(`
    match result {
      success => success,
      error => "failed"
    }
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "MatchExpression");
  const match = ast.body[0] as any;
  assertEquals(match.cases[0].pattern.kind, "IdentifierPattern");
  assertEquals(match.cases[1].pattern.kind, "IdentifierPattern");
});

// ========== Operator Precedence Tests ==========

Deno.test("Parser - complex operator precedence", () => {
  const parser = new Parser("!a && b || c && d");
  const ast = parser.parse();

  // Should parse as ((!a) && b) || (c && d)
  assertEquals(ast.body[0].kind, "BinaryExpression");
  const root = ast.body[0] as any;
  assertEquals(root.operator, "||");

  const left = root.left;
  assertEquals(left.kind, "BinaryExpression");
  assertEquals(left.operator, "&&");
  assertEquals(left.left.kind, "UnaryExpression");
  assertEquals(left.left.operator, "!");
});

Deno.test("Parser - equality vs comparison precedence", () => {
  const parser = new Parser("a > b == c < d");
  const ast = parser.parse();

  // Should parse as (a > b) == (c < d)
  assertEquals(ast.body[0].kind, "BinaryExpression");
  const root = ast.body[0] as any;
  assertEquals(root.operator, "==");
  assertEquals(root.left.operator, ">");
  assertEquals(root.right.operator, "<");
});

// ========== Edge Cases and Complex Scenarios ==========

Deno.test("Parser - let chain in single expression", () => {
  const parser = new Parser("let x = let y = 10");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "VariableDeclaration");
  const outer = ast.body[0] as any;
  const outerBinding = outer.bindings[0];
  assertEquals(outerBinding.identifier.name, "x");
  assertEquals(outerBinding.initializer.kind, "VariableDeclaration");

  const inner = outerBinding.initializer;
  const innerBinding = inner.bindings[0];
  assertEquals(innerBinding.identifier.name, "y");
  assertEquals(innerBinding.initializer.value, 10);
});

Deno.test("Parser - function as object value", () => {
  const parser = new Parser(`{
    add: (a, b) => a + b,
    sub: (a, b) => a - b
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  const obj = ast.body[0] as any;
  assertEquals(obj.properties[0].value.kind, "FunctionExpression");
  assertEquals(obj.properties[1].value.kind, "FunctionExpression");
});

Deno.test("Parser - array of functions", () => {
  const parser = new Parser("[x => x + 1, y => y * 2, z => z - 1]");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ArrayExpression");
  const arr = ast.body[0] as any;
  assertEquals(arr.elements.length, 3);
  arr.elements.forEach((elem: any) => {
    assertEquals(elem.kind, "FunctionExpression");
  });
});

Deno.test("Parser - complex real-world expression", () => {
  const parser = new Parser(`
    let users = [{
      name: "Alice",
      age: 30,
      friends: ["Bob", "Charlie"]
    }, {
      name: "Bob",
      age: 25,
      friends: ["Alice"]
    }];
    let result = map(
      filter(users, (u) => u.age > 20),
      (u) => u.name
    )
  `);
  const ast = parser.parse();

  assertEquals(ast.body.length, 2);
  assertEquals(ast.body[0].kind, "VariableDeclaration");
  assertEquals(ast.body[1].kind, "VariableDeclaration");

  const users = ast.body[0] as any;
  assertEquals(users.bindings[0].identifier.name, "users");
  assertEquals(users.bindings[0].initializer.kind, "ArrayExpression");

  const result = ast.body[1] as any;
  assertEquals(result.bindings[0].identifier.name, "result");
  assertEquals(result.bindings[0].initializer.kind, "CallExpression");
});

// ========== Error Cases ==========

Deno.test("Parser - missing closing parenthesis", () => {
  assertThrows(
    () => new Parser("(1 + 2").parse(),
    Error,
    "Expected ')'",
  );
});

Deno.test("Parser - missing closing bracket", () => {
  assertThrows(
    () => new Parser("[1, 2, 3").parse(),
    Error,
    "Expected ']'",
  );
});

Deno.test("Parser - missing closing brace", () => {
  assertThrows(
    () => new Parser("{ x: 1, y: 2").parse(),
    Error,
    "Expected '}'",
  );
});

Deno.test("Parser - invalid token", () => {
  assertThrows(
    () => new Parser("let = 42").parse(),
    Error,
    "Expected identifier",
  );
});

Deno.test("Parser - missing arrow in function", () => {
  assertThrows(
    () => new Parser("(x, y) x + y").parse(),
    Error,
    "Expected ')' after expression",
  );
});

Deno.test("Parser - missing expression after let", () => {
  assertThrows(
    () => new Parser("let x =").parse(),
    Error,
    "Unexpected token: EOF",
  );
});

// ========== Multiple Expressions Tests ==========

Deno.test("Parser - multiple top-level expressions", () => {
  const parser = new Parser(`
    42;
    "hello";
    true
  `);
  const ast = parser.parse();

  assertEquals(ast.body.length, 3);
  assertEquals(ast.body[0].kind, "NumberLiteral");
  assertEquals(ast.body[1].kind, "StringLiteral");
  assertEquals(ast.body[2].kind, "BooleanLiteral");
});

Deno.test("Parser - semicolon handling", () => {
  const parser = new Parser("1 + 2; 3 * 4; 5 - 6");
  const ast = parser.parse();

  assertEquals(ast.body.length, 3);
  ast.body.forEach((expr: any) => {
    assertEquals(expr.kind, "BinaryExpression");
  });
});
