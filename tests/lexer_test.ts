// Test for the Lexer

import { Lexer } from "../src/lexer.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Lexer - simple numbers", () => {
  const lexer = new Lexer("42 3.14");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "NUMBER");
  assertEquals(tokens[0].value, 42);

  assertEquals(tokens[1].type, "NUMBER");
  assertEquals(tokens[1].value, 3.14);

  assertEquals(tokens[2].type, "EOF");
});

Deno.test("Lexer - strings", () => {
  const lexer = new Lexer(`"hello" "world"`);
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "STRING");
  assertEquals(tokens[0].value, "hello");

  assertEquals(tokens[1].type, "STRING");
  assertEquals(tokens[1].value, "world");
});

Deno.test("Lexer - keywords", () => {
  const lexer = new Lexer("let if else true false null undefined");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "LET");
  assertEquals(tokens[1].type, "IF");
  assertEquals(tokens[2].type, "ELSE");
  assertEquals(tokens[3].type, "TRUE");
  assertEquals(tokens[3].value, true);
  assertEquals(tokens[4].type, "FALSE");
  assertEquals(tokens[4].value, false);
  assertEquals(tokens[5].type, "NULL");
  assertEquals(tokens[5].value, null);
  assertEquals(tokens[6].type, "UNDEFINED");
  assertEquals(tokens[6].value, undefined);
});

Deno.test("Lexer - operators", () => {
  const lexer = new Lexer("+ - * / == != < <= > >= && || !");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "PLUS");
  assertEquals(tokens[1].type, "MINUS");
  assertEquals(tokens[2].type, "STAR");
  assertEquals(tokens[3].type, "SLASH");
  assertEquals(tokens[4].type, "EQUAL_EQUAL");
  assertEquals(tokens[5].type, "BANG_EQUAL");
  assertEquals(tokens[6].type, "LESS");
  assertEquals(tokens[7].type, "LESS_EQUAL");
  assertEquals(tokens[8].type, "GREATER");
  assertEquals(tokens[9].type, "GREATER_EQUAL");
  assertEquals(tokens[10].type, "AMP_AMP");
  assertEquals(tokens[11].type, "PIPE_PIPE");
  assertEquals(tokens[12].type, "BANG");
});

Deno.test("Lexer - delimiters", () => {
  const lexer = new Lexer("( ) { } [ ] , . : ;");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "LEFT_PAREN");
  assertEquals(tokens[1].type, "RIGHT_PAREN");
  assertEquals(tokens[2].type, "LEFT_BRACE");
  assertEquals(tokens[3].type, "RIGHT_BRACE");
  assertEquals(tokens[4].type, "LEFT_BRACKET");
  assertEquals(tokens[5].type, "RIGHT_BRACKET");
  assertEquals(tokens[6].type, "COMMA");
  assertEquals(tokens[7].type, "DOT");
  assertEquals(tokens[8].type, "COLON");
  assertEquals(tokens[9].type, "SEMICOLON");
});

Deno.test("Lexer - arrow function", () => {
  const lexer = new Lexer("(x) => x + 1");
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "LEFT_PAREN");
  assertEquals(tokens[1].type, "IDENTIFIER");
  assertEquals(tokens[1].value, "x");
  assertEquals(tokens[2].type, "RIGHT_PAREN");
  assertEquals(tokens[3].type, "ARROW");
  assertEquals(tokens[4].type, "IDENTIFIER");
  assertEquals(tokens[5].type, "PLUS");
  assertEquals(tokens[6].type, "NUMBER");
});

Deno.test("Lexer - complex expression", () => {
  const source = `
    let x = 42;
    let add = (a, b) => a + b;
    if (x > 10) "big" else "small"
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  // First line: let x = 42;
  assertEquals(tokens[0].type, "LET");
  assertEquals(tokens[1].type, "IDENTIFIER");
  assertEquals(tokens[1].value, "x");
  assertEquals(tokens[2].type, "EQUAL");
  assertEquals(tokens[3].type, "NUMBER");
  assertEquals(tokens[3].value, 42);
  assertEquals(tokens[4].type, "SEMICOLON");

  // Function check
  const letIndex = tokens.findIndex((t) =>
    t.type === "LET" && tokens[tokens.indexOf(t) + 1]?.value === "add"
  );
  assertEquals(tokens[letIndex].type, "LET");
  assertEquals(tokens[letIndex + 1].value, "add");
});

Deno.test("Lexer - comments", () => {
  const source = `
    42 // this is a comment
    "hello" // another comment
  `;

  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();

  // Comments should be ignored
  assertEquals(tokens[0].type, "NUMBER");
  assertEquals(tokens[0].value, 42);
  assertEquals(tokens[1].type, "STRING");
  assertEquals(tokens[1].value, "hello");
  assertEquals(tokens[2].type, "EOF");
});

Deno.test("Lexer - string escapes", () => {
  const lexer = new Lexer(`"hello\\nworld" "tab\\there"`);
  const tokens = lexer.tokenize();

  assertEquals(tokens[0].type, "STRING");
  assertEquals(tokens[0].value, "hello\nworld");
  assertEquals(tokens[1].type, "STRING");
  assertEquals(tokens[1].value, "tab\there");
});
