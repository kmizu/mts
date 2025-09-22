// Lexer (Tokenizer) for MTS

import { Location, Position } from "./ast.ts";

export type TokenType =
  // Literals
  | "NUMBER"
  | "STRING"
  | "TRUE"
  | "FALSE"
  | "NULL"
  | "UNDEFINED"
  // Keywords
  | "LET"
  | "IF"
  | "ELSE"
  | "MATCH"
  | "FUNCTION"
  // Identifiers
  | "IDENTIFIER"
  // Operators
  | "PLUS" // +
  | "MINUS" // -
  | "STAR" // *
  | "SLASH" // /
  | "PERCENT" // %
  | "EQUAL_EQUAL" // ==
  | "BANG_EQUAL" // !=
  | "LESS" // <
  | "LESS_EQUAL" // <=
  | "GREATER" // >
  | "GREATER_EQUAL" // >=
  | "AMP_AMP" // &&
  | "PIPE_PIPE" // ||
  | "BANG" // !
  | "EQUAL" // =
  | "ARROW" // =>
  // Delimiters
  | "LEFT_PAREN" // (
  | "RIGHT_PAREN" // )
  | "LEFT_BRACE" // {
  | "RIGHT_BRACE" // }
  | "LEFT_BRACKET" // [
  | "RIGHT_BRACKET" // ]
  | "COMMA" // ,
  | "DOT" // .
  | "COLON" // :
  | "SEMICOLON" // ;
  | "UNDERSCORE" // _
  // Special
  | "EOF"
  | "NEWLINE";

export type Token = {
  type: TokenType;
  value: string | number | boolean | null | undefined;
  lexeme: string;
  location: Location;
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private current = 0;
  private line = 1;
  private column = 1;
  private start = 0;
  private startLine = 1;
  private startColumn = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startLine = this.line;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.addToken("EOF", null);
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      // Single-character tokens
      case "(":
        this.addToken("LEFT_PAREN");
        break;
      case ")":
        this.addToken("RIGHT_PAREN");
        break;
      case "{":
        this.addToken("LEFT_BRACE");
        break;
      case "}":
        this.addToken("RIGHT_BRACE");
        break;
      case "[":
        this.addToken("LEFT_BRACKET");
        break;
      case "]":
        this.addToken("RIGHT_BRACKET");
        break;
      case ",":
        this.addToken("COMMA");
        break;
      case ".":
        this.addToken("DOT");
        break;
      case ":":
        this.addToken("COLON");
        break;
      case ";":
        this.addToken("SEMICOLON");
        break;
      case "+":
        this.addToken("PLUS");
        break;
      case "-":
        this.addToken("MINUS");
        break;
      case "*":
        this.addToken("STAR");
        break;
      case "/":
        if (this.match("/")) {
          // Comment - skip until end of line
          while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken("SLASH");
        }
        break;
      case "%":
        this.addToken("PERCENT");
        break;
      case "_":
        this.addToken("UNDERSCORE");
        break;

      // Two-character tokens
      case "=":
        if (this.match("=")) {
          this.addToken("EQUAL_EQUAL");
        } else if (this.match(">")) {
          this.addToken("ARROW");
        } else {
          this.addToken("EQUAL");
        }
        break;
      case "!":
        this.addToken(this.match("=") ? "BANG_EQUAL" : "BANG");
        break;
      case "<":
        this.addToken(this.match("=") ? "LESS_EQUAL" : "LESS");
        break;
      case ">":
        this.addToken(this.match("=") ? "GREATER_EQUAL" : "GREATER");
        break;
      case "&":
        if (this.match("&")) {
          this.addToken("AMP_AMP");
        } else {
          this.error(`Unexpected character: ${c}`);
        }
        break;
      case "|":
        if (this.match("|")) {
          this.addToken("PIPE_PIPE");
        } else {
          this.error(`Unexpected character: ${c}`);
        }
        break;

      // Whitespace
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace
        break;
      case "\n":
        this.line++;
        this.column = 1;
        break;

      // String literals
      case '"':
        this.scanString();
        break;

      default:
        if (this.isDigit(c)) {
          this.scanNumber();
        } else if (this.isAlpha(c)) {
          this.scanIdentifier();
        } else {
          this.error(`Unexpected character: ${c}`);
        }
        break;
    }
  }

  private scanString(): void {
    let value = "";

    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 0;
      }
      if (this.peek() === "\\") {
        this.advance(); // consume backslash
        const escaped = this.advance();
        switch (escaped) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          default:
            value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.error("Unterminated string");
      return;
    }

    // Consume closing "
    this.advance();
    this.addToken("STRING", value);
  }

  private scanNumber(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal part
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken("NUMBER", value);
  }

  private scanIdentifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = this.getKeywordType(text);

    if (type) {
      this.addToken(type, this.getKeywordValue(text));
    } else {
      this.addToken("IDENTIFIER", text);
    }
  }

  private getKeywordType(text: string): TokenType | null {
    switch (text) {
      case "let":
        return "LET";
      case "if":
        return "IF";
      case "else":
        return "ELSE";
      case "match":
        return "MATCH";
      case "function":
        return "FUNCTION";
      case "true":
        return "TRUE";
      case "false":
        return "FALSE";
      case "null":
        return "NULL";
      case "undefined":
        return "UNDEFINED";
      default:
        return null;
    }
  }

  private getKeywordValue(text: string): any {
    switch (text) {
      case "true":
        return true;
      case "false":
        return false;
      case "null":
        return null;
      case "undefined":
        return undefined;
      default:
        return text;
    }
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") ||
      (c >= "A" && c <= "Z") ||
      c === "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private advance(): string {
    const c = this.source.charAt(this.current);
    this.current++;
    this.column++;
    return c;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private addToken(type: TokenType, value?: any): void {
    const lexeme = this.source.substring(this.start, this.current);

    const location: Location = {
      start: { line: this.startLine, column: this.startColumn },
      end: { line: this.line, column: this.column },
    };

    // Use hasValue to properly handle undefined as a value
    const hasValue = arguments.length > 1;

    this.tokens.push({
      type,
      value: hasValue ? value : lexeme,
      lexeme,
      location,
    });
  }

  private error(message: string): void {
    throw new Error(`[${this.line}:${this.column}] Lexer error: ${message}`);
  }
}
