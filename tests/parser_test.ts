// Test for the Parser

import { Parser } from "../src/parser.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Parser - literals", () => {
  const parser = new Parser("42");
  const ast = parser.parse();

  assertEquals(ast.kind, "Program");
  assertEquals(ast.body.length, 1);
  assertEquals(ast.body[0].kind, "NumberLiteral");
  assertEquals((ast.body[0] as any).value, 42);
});

Deno.test("Parser - string literal", () => {
  const parser = new Parser(`"hello world"`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "StringLiteral");
  assertEquals((ast.body[0] as any).value, "hello world");
});

Deno.test("Parser - boolean literals", () => {
  const parser = new Parser("true false");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BooleanLiteral");
  assertEquals((ast.body[0] as any).value, true);
  assertEquals(ast.body[1].kind, "BooleanLiteral");
  assertEquals((ast.body[1] as any).value, false);
});

Deno.test("Parser - null and undefined", () => {
  const parser = new Parser("null undefined");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "NullLiteral");
  assertEquals(ast.body[1].kind, "UndefinedLiteral");
});

Deno.test("Parser - binary expressions", () => {
  const parser = new Parser("1 + 2 * 3");
  const ast = parser.parse();

  // Should parse as 1 + (2 * 3) due to precedence
  assertEquals(ast.body[0].kind, "BinaryExpression");
  const expr = ast.body[0] as any;
  assertEquals(expr.operator, "+");
  assertEquals(expr.left.kind, "NumberLiteral");
  assertEquals(expr.left.value, 1);
  assertEquals(expr.right.kind, "BinaryExpression");
  assertEquals(expr.right.operator, "*");
});

Deno.test("Parser - unary expressions", () => {
  const parser = new Parser("!true; -42");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "UnaryExpression");
  assertEquals((ast.body[0] as any).operator, "!");

  assertEquals(ast.body[1].kind, "UnaryExpression");
  assertEquals((ast.body[1] as any).operator, "-");
});

Deno.test("Parser - let expression", () => {
  const parser = new Parser("let x = 42");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "VariableDeclaration");
  const decl = ast.body[0] as any;
  assertEquals(decl.bindings.length, 1);
  assertEquals(decl.bindings[0].identifier.name, "x");
  assertEquals(decl.bindings[0].initializer.kind, "NumberLiteral");
  assertEquals(decl.bindings[0].initializer.value, 42);
});

Deno.test("Parser - function expression", () => {
  const parser = new Parser("(x, y) => x + y");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "FunctionExpression");
  const func = ast.body[0] as any;
  assertEquals(func.parameters.length, 2);
  assertEquals(func.parameters[0].identifier.name, "x");
  assertEquals(func.parameters[1].identifier.name, "y");
  assertEquals(func.body.kind, "BinaryExpression");
});

Deno.test("Parser - single param arrow function", () => {
  const parser = new Parser("x => x * 2");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "FunctionExpression");
  const func = ast.body[0] as any;
  assertEquals(func.parameters.length, 1);
  assertEquals(func.parameters[0].identifier.name, "x");
});

Deno.test("Parser - function call", () => {
  const parser = new Parser("add(1, 2)");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "CallExpression");
  const call = ast.body[0] as any;
  assertEquals(call.callee.kind, "Identifier");
  assertEquals(call.callee.name, "add");
  assertEquals(call.arguments.length, 2);
});

Deno.test("Parser - array expression", () => {
  const parser = new Parser("[1, 2, 3]");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ArrayExpression");
  const arr = ast.body[0] as any;
  assertEquals(arr.elements.length, 3);
  assertEquals(arr.elements[0].value, 1);
  assertEquals(arr.elements[1].value, 2);
  assertEquals(arr.elements[2].value, 3);
});

Deno.test("Parser - dictionary expression", () => {
  const parser = new Parser('["key": "value", "num": 42]');
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "DictionaryExpression");
  const dict = ast.body[0] as any;
  assertEquals(dict.entries.length, 2);

  assertEquals(dict.entries[0].key.value, "key");
  assertEquals(dict.entries[0].value.value, "value");
  assertEquals(dict.entries[1].key.value, "num");
  assertEquals(dict.entries[1].value.value, 42);
});

Deno.test("Parser - dictionary with number keys", () => {
  const parser = new Parser('[1: "one", 2: "two"]');
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "DictionaryExpression");
  const dict = ast.body[0] as any;
  assertEquals(dict.entries.length, 2);

  assertEquals(dict.entries[0].key.value, 1);
  assertEquals(dict.entries[0].value.value, "one");
  assertEquals(dict.entries[1].key.value, 2);
  assertEquals(dict.entries[1].value.value, "two");
});

Deno.test("Parser - empty array", () => {
  // Empty brackets should parse as array
  const parser = new Parser("[]");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ArrayExpression");
  const arr = ast.body[0] as any;
  assertEquals(arr.elements.length, 0);
});

Deno.test("Parser - object expression", () => {
  const parser = new Parser(`{ name: "John", age: 30 }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "ObjectExpression");
  const obj = ast.body[0] as any;
  assertEquals(obj.properties.length, 2);
  assertEquals(obj.properties[0].key, "name");
  assertEquals(obj.properties[0].value.kind, "StringLiteral");
  assertEquals(obj.properties[1].key, "age");
  assertEquals(obj.properties[1].value.kind, "NumberLiteral");
});

Deno.test("Parser - member expression", () => {
  const parser = new Parser("person.name");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "MemberExpression");
  const member = ast.body[0] as any;
  assertEquals(member.object.kind, "Identifier");
  assertEquals(member.object.name, "person");
  assertEquals(member.property, "name");
});

Deno.test("Parser - index expression", () => {
  const parser = new Parser("arr[0]");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "IndexExpression");
  const index = ast.body[0] as any;
  assertEquals(index.array.kind, "Identifier");
  assertEquals(index.array.name, "arr");
  assertEquals(index.index.kind, "NumberLiteral");
  assertEquals(index.index.value, 0);
});

Deno.test("Parser - if expression", () => {
  const parser = new Parser(`if (x > 10) "big" else "small"`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "IfExpression");
  const ifExpr = ast.body[0] as any;
  assertEquals(ifExpr.condition.kind, "BinaryExpression");
  assertEquals(ifExpr.thenBranch.kind, "StringLiteral");
  assertEquals(ifExpr.elseBranch.kind, "StringLiteral");
});

Deno.test("Parser - block expression", () => {
  const parser = new Parser(`{
    let x = 10;
    let y = 20;
    x + y
  }`);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BlockExpression");
  const block = ast.body[0] as any;
  assertEquals(block.statements.length, 2);
  assertEquals(block.statements[0].kind, "LetStatement");
  assertEquals(block.statements[1].kind, "LetStatement");
  assertEquals(block.expression.kind, "BinaryExpression");
});

Deno.test("Parser - match expression", () => {
  const parser = new Parser(`
    match x {
      0 => "zero",
      1 => "one",
      _ => "other"
    }
  `);
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "MatchExpression");
  const match = ast.body[0] as any;
  assertEquals(match.expression.kind, "Identifier");
  assertEquals(match.cases.length, 3);
  assertEquals(match.cases[0].pattern.kind, "LiteralPattern");
  assertEquals(match.cases[1].pattern.kind, "LiteralPattern");
  assertEquals(match.cases[2].pattern.kind, "WildcardPattern");
});

Deno.test("Parser - complex expression", () => {
  const parser = new Parser(`
    let add = (a, b) => a + b;
    let result = add(10, 20)
  `);
  const ast = parser.parse();

  assertEquals(ast.body.length, 2);
  assertEquals(ast.body[0].kind, "VariableDeclaration");
  assertEquals(ast.body[1].kind, "VariableDeclaration");

  const add = ast.body[0] as any;
  assertEquals(add.bindings.length, 1);
  assertEquals(add.bindings[0].identifier.name, "add");
  assertEquals(add.bindings[0].initializer.kind, "FunctionExpression");

  const result = ast.body[1] as any;
  assertEquals(result.bindings.length, 1);
  assertEquals(result.bindings[0].identifier.name, "result");
  assertEquals(result.bindings[0].initializer.kind, "CallExpression");
});

Deno.test("Parser - logical operators", () => {
  const parser = new Parser("true && false || true");
  const ast = parser.parse();

  // Should parse as (true && false) || true
  assertEquals(ast.body[0].kind, "BinaryExpression");
  const expr = ast.body[0] as any;
  assertEquals(expr.operator, "||");
  assertEquals(expr.left.kind, "BinaryExpression");
  assertEquals(expr.left.operator, "&&");
});

Deno.test("Parser - comparison operators", () => {
  const parser = new Parser("x > 5 && y <= 10");
  const ast = parser.parse();

  assertEquals(ast.body[0].kind, "BinaryExpression");
  const expr = ast.body[0] as any;
  assertEquals(expr.operator, "&&");
  assertEquals(expr.left.operator, ">");
  assertEquals(expr.right.operator, "<=");
});

Deno.test("Parser - grouped expression", () => {
  const parser = new Parser("(1 + 2) * 3");
  const ast = parser.parse();

  // Should parse as (1 + 2) * 3
  assertEquals(ast.body[0].kind, "BinaryExpression");
  const expr = ast.body[0] as any;
  assertEquals(expr.operator, "*");
  assertEquals(expr.left.kind, "BinaryExpression");
  assertEquals(expr.left.operator, "+");
  assertEquals(expr.right.value, 3);
});
