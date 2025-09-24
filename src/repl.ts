// REPL (Read-Eval-Print Loop) for MTS

import { Parser } from "./parser.ts";
import { TypeInferrer } from "./infer.ts";
import { Evaluator } from "./evaluator.ts";
import { typeToString } from "./types.ts";

export class REPL {
  private parser: Parser;
  private inferrer: TypeInferrer;
  private evaluator: Evaluator;
  private globalEnv: Map<string, any>;

  constructor() {
    this.parser = new Parser("");
    this.inferrer = new TypeInferrer();
    this.evaluator = new Evaluator();
    this.globalEnv = new Map();
  }

  private formatValue(value: any): string {
    if (value === null) {
      return "null";
    }
    if (value === undefined) {
      return "undefined";
    }
    if (typeof value === "string") {
      return `"${value}"`;
    }
    if (typeof value === "number") {
      return value.toString();
    }
    if (typeof value === "boolean") {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return `[${value.map((v) => this.formatValue(v)).join(", ")}]`;
    }
    if (typeof value === "object" && value !== null) {
      if ("kind" in value && value.kind === "function") {
        return "<function>";
      }
      const entries = Object.entries(value)
        .map(([key, val]) => `${key}: ${this.formatValue(val)}`)
        .join(", ");
      return `{ ${entries} }`;
    }
    if (typeof value === "function") {
      return "<function>";
    }
    return String(value);
  }

  private colorize(text: string, color: string): string {
    const colors = {
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m",
      gray: "\x1b[90m",
      reset: "\x1b[0m",
    };
    return `${colors[color as keyof typeof colors] || ""}${text}${colors.reset}`;
  }

  evaluate(input: string): { value?: any; type?: string; error?: string } {
    try {
      // Parse the input
      this.parser = new Parser(input.trim());
      const ast = this.parser.parse();

      // Type inference
      const typeEnv = this.inferrer.inferAndSolve(ast);

      // Get the type of the last expression
      let resultType = "Unit";
      if (ast.body.length > 0) {
        const lastExpr = ast.body[ast.body.length - 1];
        if (lastExpr.kind === "VariableDeclaration") {
          const lastBinding = lastExpr.bindings[lastExpr.bindings.length - 1];
          const scheme = typeEnv.get(lastBinding.identifier.name);
          if (scheme) {
            resultType = typeToString(scheme.type);
          }
        } else {
          // For expressions, create a fresh inferrer to avoid constraint conflicts
          const freshInferrer = new TypeInferrer();
          const exprType = freshInferrer.inferExpression(lastExpr, typeEnv);
          resultType = typeToString(exprType);
        }
      }

      // Evaluate
      const result = this.evaluator.evaluate(ast);

      return {
        value: result,
        type: resultType,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  printWelcome(): void {
    console.log(this.colorize("🚀 Welcome to MTS REPL!", "cyan"));
    console.log(this.colorize("A functional programming language with HM type inference", "gray"));
    console.log(this.colorize("Type ':help' for help, ':quit' to exit", "gray"));
    console.log();
  }

  printHelp(): void {
    console.log(this.colorize("MTS REPL Commands:", "yellow"));
    console.log("  :help     - Show this help message");
    console.log("  :quit     - Exit the REPL");
    console.log("  :type <expr> - Show the type of an expression");
    console.log("  :clear    - Clear the screen");
    console.log();
    console.log(this.colorize("Language Features:", "yellow"));
    console.log("  • Variables: let x = 42");
    console.log("  • Functions: let add = (x, y) => x + y");
    console.log("  • Arrays: [1, 2, 3]");
    console.log('  • Objects: { name: "Alice", age: 30 }');
    console.log('  • If expressions: if (x > 0) "positive" else "negative"');
    console.log('  • Match expressions: match x { 0 => "zero", _ => "other" }');
    console.log();
    console.log(this.colorize("Built-in Functions:", "yellow"));
    console.log("  Array: length, head, tail, push, empty");
    console.log("  String: concat, substring, strlen");
    console.log("  Math: sqrt, abs, floor, ceil");
    console.log("  I/O: print, println, readText, writeText");
    console.log("  Conversion: toString, toNumber");
    console.log();
  }

  showType(expression: string): void {
    try {
      this.parser = new Parser(expression.trim());
      const ast = this.parser.parse();

      if (ast.body.length === 0) {
        console.log(this.colorize("Error: Empty expression", "red"));
        return;
      }

      const typeEnv = this.inferrer.createInitialEnv();
      const exprType = this.inferrer.inferExpression(ast.body[0], typeEnv);
      const typeStr = typeToString(exprType);

      console.log(
        this.colorize(`${expression}`, "white") + this.colorize(" : ", "gray") +
          this.colorize(typeStr, "blue"),
      );
    } catch (error) {
      console.log(
        this.colorize(
          `Type error: ${error instanceof Error ? error.message : String(error)}`,
          "red",
        ),
      );
    }
  }

  async run(): Promise<void> {
    this.printWelcome();

    while (true) {
      // Prompt
      const prompt = this.colorize("mts> ", "green");
      const input = await this.readLine(prompt);

      if (!input || input.trim() === "") {
        continue;
      }

      const trimmed = input.trim();

      // Handle REPL commands
      if (trimmed === ":help") {
        this.printHelp();
        continue;
      }

      if (trimmed === ":quit" || trimmed === ":q") {
        console.log(this.colorize("Goodbye! 👋", "cyan"));
        break;
      }

      if (trimmed === ":clear") {
        console.clear();
        this.printWelcome();
        continue;
      }

      if (trimmed.startsWith(":type ")) {
        const expr = trimmed.slice(6);
        this.showType(expr);
        continue;
      }

      // Evaluate the input
      const result = this.evaluate(trimmed);

      if (result.error) {
        console.log(this.colorize(`Error: ${result.error}`, "red"));
      } else {
        if (result.value !== null && result.value !== undefined) {
          console.log(
            this.colorize(this.formatValue(result.value), "white") +
              this.colorize(" : ", "gray") +
              this.colorize(result.type || "unknown", "blue"),
          );
        }
      }
    }
  }

  private async readLine(prompt: string): Promise<string> {
    // For Deno, we'll use a simple implementation
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    await Deno.stdout.write(encoder.encode(prompt));

    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf);

    if (n === null) {
      return "";
    }

    return decoder.decode(buf.subarray(0, n)).trim();
  }
}
