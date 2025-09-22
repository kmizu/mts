// Parser for MTS - recursive descent parser

import { Lexer, Token, TokenType } from "./lexer.ts";

import {
  ArrayExpression,
  ArrayTypeExpression,
  BinaryExpression,
  BinaryOperator,
  BlockExpression,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionExpression,
  FunctionTypeExpression,
  Identifier,
  IdentifierPattern,
  IfExpression,
  IndexExpression,
  LetStatement,
  LiteralPattern,
  Location,
  MatchCase,
  MatchExpression,
  MemberExpression,
  NullLiteral,
  NumberLiteral,
  ObjectExpression,
  ObjectProperty,
  ObjectTypeExpression,
  Parameter,
  Pattern,
  PrimitiveTypeExpression,
  Program,
  Statement,
  StringLiteral,
  TypeAnnotation,
  TypeExpression,
  TypeVariable,
  UnaryExpression,
  UnaryOperator,
  UndefinedLiteral,
  VariableDeclaration,
  WildcardPattern,
} from "./ast.ts";

export class ParseError extends Error {
  constructor(message: string, public location?: Location) {
    super(message);
    this.name = "ParseError";
  }
}

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(source: string) {
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
  }

  parse(): Program {
    const body: Expression[] = [];

    while (!this.isAtEnd()) {
      body.push(this.parseExpression());

      // Optional semicolon
      if (this.match("SEMICOLON")) {
        // consume it
      }
    }

    return {
      kind: "Program",
      body,
    };
  }

  private parseExpression(): Expression {
    return this.parseLetExpression();
  }

  private parseLetExpression(): Expression {
    if (this.match("LET")) {
      const identifier = this.consumeIdentifier();
      this.consume("EQUAL", "Expected '=' after identifier in let expression");
      const initializer = this.parseExpression();

      return {
        kind: "VariableDeclaration",
        identifier,
        initializer,
      } as VariableDeclaration;
    }

    return this.parseLogicalOr();
  }

  private parseLogicalOr(): Expression {
    let expr = this.parseLogicalAnd();

    while (this.match("PIPE_PIPE")) {
      const operator = "||" as BinaryOperator;
      const right = this.parseLogicalAnd();
      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      } as BinaryExpression;
    }

    return expr;
  }

  private parseLogicalAnd(): Expression {
    let expr = this.parseEquality();

    while (this.match("AMP_AMP")) {
      const operator = "&&" as BinaryOperator;
      const right = this.parseEquality();
      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      } as BinaryExpression;
    }

    return expr;
  }

  private parseEquality(): Expression {
    let expr = this.parseComparison();

    while (this.matchAny("EQUAL_EQUAL", "BANG_EQUAL")) {
      const operator = (this.previous().type === "EQUAL_EQUAL" ? "==" : "!=") as BinaryOperator;
      const right = this.parseComparison();
      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      } as BinaryExpression;
    }

    return expr;
  }

  private parseComparison(): Expression {
    let expr = this.parseAddition();

    while (this.matchAny("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      const tokenType = this.previous().type;
      const operator = (
        tokenType === "GREATER"
          ? ">"
          : tokenType === "GREATER_EQUAL"
          ? ">="
          : tokenType === "LESS"
          ? "<"
          : "<="
      ) as BinaryOperator;
      const right = this.parseAddition();
      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      } as BinaryExpression;
    }

    return expr;
  }

  private parseAddition(): Expression {
    let expr = this.parseMultiplication();

    while (this.matchAny("PLUS", "MINUS")) {
      const operator = (this.previous().type === "PLUS" ? "+" : "-") as BinaryOperator;
      const right = this.parseMultiplication();
      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      } as BinaryExpression;
    }

    return expr;
  }

  private parseMultiplication(): Expression {
    let expr = this.parseUnary();

    while (this.matchAny("STAR", "SLASH", "PERCENT")) {
      const tokenType = this.previous().type;
      const operator = (
        tokenType === "STAR" ? "*" : tokenType === "SLASH" ? "/" : "%"
      ) as BinaryOperator;
      const right = this.parseUnary();
      expr = {
        kind: "BinaryExpression",
        operator,
        left: expr,
        right,
      } as BinaryExpression;
    }

    return expr;
  }

  private parseUnary(): Expression {
    if (this.matchAny("BANG", "MINUS")) {
      const operator = (this.previous().type === "BANG" ? "!" : "-") as UnaryOperator;
      const operand = this.parseUnary();
      return {
        kind: "UnaryExpression",
        operator,
        operand,
      } as UnaryExpression;
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match("LEFT_PAREN")) {
        // Function call
        const args: Expression[] = [];
        if (!this.check("RIGHT_PAREN")) {
          do {
            args.push(this.parseExpression());
          } while (this.match("COMMA"));
        }
        this.consume("RIGHT_PAREN", "Expected ')' after arguments");

        expr = {
          kind: "CallExpression",
          callee: expr,
          arguments: args,
        } as CallExpression;
      } else if (this.match("DOT")) {
        // Member access
        const property = this.consume("IDENTIFIER", "Expected property name after '.'")
          .value as string;
        expr = {
          kind: "MemberExpression",
          object: expr,
          property,
        } as MemberExpression;
      } else if (this.match("LEFT_BRACKET")) {
        // Index access
        const index = this.parseExpression();
        this.consume("RIGHT_BRACKET", "Expected ']' after index");
        expr = {
          kind: "IndexExpression",
          array: expr,
          index,
        } as IndexExpression;
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expression {
    // Literals
    if (this.match("TRUE")) {
      return {
        kind: "BooleanLiteral",
        value: true,
        loc: this.previous().location,
      } as BooleanLiteral;
    }

    if (this.match("FALSE")) {
      return {
        kind: "BooleanLiteral",
        value: false,
        loc: this.previous().location,
      } as BooleanLiteral;
    }

    if (this.match("NULL")) {
      return {
        kind: "NullLiteral",
        loc: this.previous().location,
      } as NullLiteral;
    }

    if (this.match("UNDEFINED")) {
      return {
        kind: "UndefinedLiteral",
        loc: this.previous().location,
      } as UndefinedLiteral;
    }

    if (this.match("NUMBER")) {
      return {
        kind: "NumberLiteral",
        value: this.previous().value as number,
        loc: this.previous().location,
      } as NumberLiteral;
    }

    if (this.match("STRING")) {
      return {
        kind: "StringLiteral",
        value: this.previous().value as string,
        loc: this.previous().location,
      } as StringLiteral;
    }

    // If expression
    if (this.match("IF")) {
      return this.parseIfExpression();
    }

    // Match expression
    if (this.match("MATCH")) {
      return this.parseMatchExpression();
    }

    // Array literal
    if (this.match("LEFT_BRACKET")) {
      return this.parseArrayExpression();
    }

    // Block or Object literal
    if (this.match("LEFT_BRACE")) {
      return this.parseBlockOrObjectExpression();
    }

    // Function expression or grouped expression
    if (this.match("LEFT_PAREN")) {
      // Look ahead to determine if it's a function
      if (this.checkFunctionParameters()) {
        return this.parseFunctionExpression();
      } else {
        // Grouped expression
        const expr = this.parseExpression();
        this.consume("RIGHT_PAREN", "Expected ')' after expression");
        return expr;
      }
    }

    // Identifier
    if (this.match("IDENTIFIER")) {
      const name = this.previous().value as string;

      // Check for arrow function shorthand (single param)
      if (this.check("ARROW")) {
        this.advance(); // consume =>
        const body = this.parseExpression();
        return {
          kind: "FunctionExpression",
          parameters: [{
            kind: "Parameter",
            identifier: {
              kind: "Identifier",
              name,
            } as Identifier,
            typeAnnotation: undefined,
          } as Parameter],
          body,
          returnTypeAnnotation: undefined,
        } as FunctionExpression;
      }

      return {
        kind: "Identifier",
        name,
        loc: this.previous().location,
      } as Identifier;
    }

    throw new ParseError(
      `Unexpected token: ${this.peek().type}`,
      this.peek().location,
    );
  }

  private parseIfExpression(): IfExpression {
    this.consume("LEFT_PAREN", "Expected '(' after 'if'");
    const condition = this.parseExpression();
    this.consume("RIGHT_PAREN", "Expected ')' after condition");

    const thenBranch = this.parseExpression();

    let elseBranch: Expression | null = null;
    if (this.match("ELSE")) {
      elseBranch = this.parseExpression();
    }

    return {
      kind: "IfExpression",
      condition,
      thenBranch,
      elseBranch,
    };
  }

  private parseMatchExpression(): MatchExpression {
    const expression = this.parseExpression();
    this.consume("LEFT_BRACE", "Expected '{' after match expression");

    const cases: MatchCase[] = [];

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      const pattern = this.parsePattern();

      let guard: Expression | undefined;
      if (this.match("IF")) {
        guard = this.parseExpression();
      }

      this.consume("ARROW", "Expected '=>' after pattern");
      const body = this.parseExpression();

      cases.push({
        pattern,
        guard,
        body,
      });

      // Optional comma
      this.match("COMMA");
    }

    this.consume("RIGHT_BRACE", "Expected '}' after match cases");

    return {
      kind: "MatchExpression",
      expression,
      cases,
    };
  }

  private parsePattern(): Pattern {
    if (this.match("UNDERSCORE")) {
      return {
        kind: "WildcardPattern",
        loc: this.previous().location,
      } as WildcardPattern;
    }

    if (this.match("NUMBER")) {
      return {
        kind: "LiteralPattern",
        value: {
          kind: "NumberLiteral",
          value: this.previous().value as number,
          loc: this.previous().location,
        },
        loc: this.previous().location,
      } as LiteralPattern;
    }

    if (this.match("STRING")) {
      return {
        kind: "LiteralPattern",
        value: {
          kind: "StringLiteral",
          value: this.previous().value as string,
          loc: this.previous().location,
        },
        loc: this.previous().location,
      } as LiteralPattern;
    }

    if (this.match("TRUE") || this.match("FALSE")) {
      return {
        kind: "LiteralPattern",
        value: {
          kind: "BooleanLiteral",
          value: this.previous().value as boolean,
          loc: this.previous().location,
        },
        loc: this.previous().location,
      } as LiteralPattern;
    }

    if (this.match("NULL")) {
      return {
        kind: "LiteralPattern",
        value: {
          kind: "NullLiteral",
          loc: this.previous().location,
        },
        loc: this.previous().location,
      } as LiteralPattern;
    }

    if (this.match("IDENTIFIER")) {
      return {
        kind: "IdentifierPattern",
        identifier: {
          kind: "Identifier",
          name: this.previous().value as string,
          loc: this.previous().location,
        },
        loc: this.previous().location,
      } as IdentifierPattern;
    }

    throw new ParseError(
      `Expected pattern, got ${this.peek().type}`,
      this.peek().location,
    );
  }

  private parseArrayExpression(): ArrayExpression {
    const elements: Expression[] = [];

    if (!this.check("RIGHT_BRACKET")) {
      do {
        elements.push(this.parseExpression());
      } while (this.match("COMMA"));
    }

    this.consume("RIGHT_BRACKET", "Expected ']' after array elements");

    return {
      kind: "ArrayExpression",
      elements,
    };
  }

  private parseBlockOrObjectExpression(): Expression {
    const startPos = this.current - 1;

    // Try to determine if it's a block or object
    // If we see 'let' it's definitely a block
    // If we see 'identifier:' it's an object
    if (this.check("LET")) {
      return this.parseBlockExpression();
    } else if (this.isObjectLiteral()) {
      return this.parseObjectExpression();
    } else {
      // Default to block for other cases
      return this.parseBlockExpression();
    }
  }

  private isObjectLiteral(): boolean {
    // Look ahead to check if this looks like an object literal
    const saved = this.current;

    if (this.check("RIGHT_BRACE")) {
      // Empty object
      return true;
    }

    if (this.match("IDENTIFIER")) {
      const isObject = this.check("COLON");
      this.current = saved;
      return isObject;
    }

    if (this.match("STRING")) {
      const isObject = this.check("COLON");
      this.current = saved;
      return isObject;
    }

    this.current = saved;
    return false;
  }

  private parseObjectExpression(): ObjectExpression {
    const properties: ObjectProperty[] = [];

    if (!this.check("RIGHT_BRACE")) {
      do {
        let key: string;

        if (this.match("IDENTIFIER")) {
          key = this.previous().value as string;
        } else if (this.match("STRING")) {
          key = this.previous().value as string;
        } else {
          throw new ParseError(
            "Expected property key",
            this.peek().location,
          );
        }

        this.consume("COLON", "Expected ':' after property key");
        const value = this.parseExpression();

        properties.push({
          key,
          value,
        });
      } while (this.match("COMMA"));
    }

    this.consume("RIGHT_BRACE", "Expected '}' after object properties");

    return {
      kind: "ObjectExpression",
      properties,
    };
  }

  private parseBlockExpression(): BlockExpression {
    const statements: Statement[] = [];

    while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
      if (this.match("LET")) {
        const identifier = this.consumeIdentifier();
        this.consume("EQUAL", "Expected '=' in let statement");
        const initializer = this.parseExpression();

        statements.push({
          kind: "LetStatement",
          identifier,
          initializer,
        } as LetStatement);

        // Optional semicolon
        this.match("SEMICOLON");
      } else {
        // Expression statement
        const expression = this.parseExpression();

        // Check if this is the last expression (no semicolon and next is '}')
        if (this.check("RIGHT_BRACE")) {
          this.consume("RIGHT_BRACE", "Expected '}'");
          return {
            kind: "BlockExpression",
            statements,
            expression,
          };
        }

        statements.push({
          kind: "ExpressionStatement",
          expression,
        } as ExpressionStatement);

        // Optional semicolon
        this.match("SEMICOLON");
      }
    }

    this.consume("RIGHT_BRACE", "Expected '}' after block");

    // If we get here, the block has no final expression, use unit value
    return {
      kind: "BlockExpression",
      statements,
      expression: {
        kind: "UndefinedLiteral",
      } as UndefinedLiteral,
    };
  }

  private parseFunctionExpression(): FunctionExpression {
    const parameters: Parameter[] = [];

    // We already consumed '('
    if (!this.check("RIGHT_PAREN")) {
      do {
        parameters.push(this.parseParameter());
      } while (this.match("COMMA"));
    }

    this.consume("RIGHT_PAREN", "Expected ')' after parameters");

    // Optional return type annotation
    let returnTypeAnnotation: TypeAnnotation | undefined;
    if (this.match("COLON")) {
      returnTypeAnnotation = {
        kind: "TypeAnnotation",
        type: this.parseTypeExpression(),
        loc: this.previous().location,
      };
    }

    this.consume("ARROW", "Expected '=>' after parameters");

    const body = this.parseExpression();

    return {
      kind: "FunctionExpression",
      parameters,
      body,
      returnTypeAnnotation,
    };
  }

  private parseParameter(): Parameter {
    const identifier = this.consumeIdentifier();

    let typeAnnotation: TypeAnnotation | undefined;
    if (this.match("COLON")) {
      typeAnnotation = {
        kind: "TypeAnnotation",
        type: this.parseTypeExpression(),
        loc: this.previous().location,
      };
    }

    return {
      kind: "Parameter",
      identifier,
      typeAnnotation,
      loc: identifier.loc,
    };
  }

  private parseTypeExpression(): TypeExpression {
    return this.parseBaseTypeExpression();
  }

  private parseBaseTypeExpression(): TypeExpression {
    // Function type: (T, U) => V
    if (this.match("LEFT_PAREN")) {
      const paramTypes: TypeExpression[] = [];

      if (!this.check("RIGHT_PAREN")) {
        do {
          paramTypes.push(this.parseBaseTypeExpression());
        } while (this.match("COMMA"));
      }

      this.consume("RIGHT_PAREN", "Expected ')' after parameter types");
      this.consume("ARROW", "Expected '=>' in function type");

      const returnType = this.parseBaseTypeExpression();

      return {
        kind: "FunctionTypeExpression",
        paramTypes,
        returnType,
        loc: this.previous().location,
      };
    }

    // Base type (primitive or type variable)
    if (this.match("IDENTIFIER")) {
      const name = this.previous().value as string;

      // Check for primitive types
      if (["number", "string", "boolean", "unit"].includes(name)) {
        return {
          kind: "PrimitiveTypeExpression",
          primitive: name as any,
          loc: this.previous().location,
        };
      }

      // Type variable
      return {
        kind: "TypeVariable",
        name,
        loc: this.previous().location,
      };
    }

    // Handle null and undefined as special keywords
    if (this.match("NULL")) {
      return {
        kind: "PrimitiveTypeExpression",
        primitive: "null",
        loc: this.previous().location,
      };
    }

    if (this.match("UNDEFINED")) {
      return {
        kind: "PrimitiveTypeExpression",
        primitive: "undefined",
        loc: this.previous().location,
      };
    }

    throw new ParseError("Expected type expression", this.peek().location);
  }

  private checkFunctionParameters(): boolean {
    const saved = this.current;

    // Check for empty params ()
    if (this.check("RIGHT_PAREN")) {
      this.advance();
      // Check for return type annotation ": type"
      if (this.match("COLON")) {
        this.skipTypeExpression();
      }
      const isFunction = this.check("ARROW");
      this.current = saved;
      return isFunction;
    }

    // Check for identifier params (with optional type annotations)
    if (this.check("IDENTIFIER")) {
      while (this.match("IDENTIFIER")) {
        // Skip optional type annotation ": type"
        if (this.match("COLON")) {
          // Skip type expression
          this.skipTypeExpression();
        }

        if (this.match("COMMA")) {
          continue;
        }
        if (this.match("RIGHT_PAREN")) {
          // Check for return type annotation ": type"
          if (this.match("COLON")) {
            this.skipTypeExpression();
          }
          const isFunction = this.check("ARROW");
          this.current = saved;
          return isFunction;
        }
        break;
      }
    }

    this.current = saved;
    return false;
  }

  private skipTypeExpression(): void {
    // Simple type skipping - just consume identifiers and basic syntax
    if (
      this.check("IDENTIFIER") || this.check("NUMBER") || this.check("STRING") ||
      this.check("TRUE") || this.check("FALSE") || this.check("NULL") || this.check("UNDEFINED")
    ) {
      this.advance();
    } else if (this.match("LEFT_PAREN")) {
      // Function type - skip until matching )
      let depth = 1;
      while (depth > 0 && !this.isAtEnd()) {
        if (this.check("LEFT_PAREN")) {
          depth++;
        } else if (this.check("RIGHT_PAREN")) {
          depth--;
        }
        this.advance();
      }
      // Skip => and return type
      if (this.match("ARROW")) {
        this.skipTypeExpression();
      }
    }
  }

  private consumeIdentifier(): Identifier {
    this.consume("IDENTIFIER", "Expected identifier");
    return {
      kind: "Identifier",
      name: this.previous().value as string,
      loc: this.previous().location,
    };
  }

  // Helper methods
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchAny(...types: TokenType[]): boolean {
    return this.match(...types);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw new ParseError(message, this.peek().location);
  }
}
