// CLI for MTS - Main entry point

import { Parser } from "./parser.ts";
import { TypeInferrer } from "./infer.ts";
import { REPL } from "./repl.ts";
import { applySubstitution, typeToString } from "./types.ts";
import { ModuleLoader } from "./module_loader.ts";
import { Expression } from "./ast.ts";

function printUsage(): void {
  console.log("MTS - A functional programming language with HM type inference");
  console.log("");
  console.log("Usage:");
  console.log("  mts                    Start interactive REPL");
  console.log("  mts <file>             Run a MTS file");
  console.log("  mts -e <code>          Evaluate code directly");
  console.log("  mts -t <code>          Show type of expression");
  console.log("  mts -h, --help         Show this help");
  console.log("");
  console.log("Examples:");
  console.log("  mts                                    # Start REPL");
  console.log("  mts examples/hello.tjs                # Run file");
  console.log('  mts -e "let x = 42; x * 2"            # Evaluate code');
  console.log('  mts -t "(x) => x + 1"                 # Show type');
  console.log("");
}

function formatValue(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    if ("kind" in value && value.kind === "function") {
      return "<function>";
    }
    const entries = Object.entries(value)
      .map(([key, val]) => `${key}: ${formatValue(val)}`)
      .join(", ");
    return `{ ${entries} }`;
  }
  return String(value);
}

async function runFile(filepath: string): Promise<void> {
  try {
    const loader = new ModuleLoader();
    const record = await loader.loadModule(filepath);

    console.log("✅ Type checking passed");

    if (record.lastValue !== null && record.lastValue !== undefined) {
      console.log("Result:", formatValue(record.lastValue));
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

async function evaluateCode(code: string): Promise<void> {
  try {
    const loader = new ModuleLoader();
    const cwd = await Deno.realPath(".");
    const virtualPath = `${cwd}/__inline__/${crypto.randomUUID()}.mts`;
    const record = await loader.loadModuleFromSource(virtualPath, code);
    const program = record.program;

    // Determine result type
    let resultType = "Unit";
    if (program.body.length > 0) {
      const lastExpr = program.body[program.body.length - 1] as Expression;
      if (lastExpr.kind === "VariableDeclaration") {
        const lastBinding = lastExpr.bindings[lastExpr.bindings.length - 1];
        const scheme = record.typeEnv.get(lastBinding.identifier.name);
        if (scheme) {
          resultType = typeToString(scheme.type);
        }
      } else {
        const freshInferrer = new TypeInferrer();
        const envCopy = new Map(record.typeEnv);
        const exprType = freshInferrer.inferExpression(lastExpr, envCopy);
        const substitution = freshInferrer.solveConstraints();
        resultType = typeToString(applySubstitution(substitution, exprType));
      }
    }

    if (record.lastValue !== null && record.lastValue !== undefined) {
      console.log(`${formatValue(record.lastValue)} : ${resultType}`);
    } else {
      console.log(`() : ${resultType}`);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

function showType(expression: string): void {
  try {
    // Parse
    const parser = new Parser(expression);
    const ast = parser.parse();

    if (ast.body.length === 0) {
      console.error("Error: Empty expression");
      Deno.exit(1);
    }

    // Type inference with constraint solving
    const inferrer = new TypeInferrer();
    const typeEnv = inferrer.createInitialEnv();
    const exprType = inferrer.inferExpression(ast.body[0], typeEnv);

    // Solve constraints to get the complete type
    const substitution = inferrer.solveConstraints();
    const solvedType = applySubstitution(substitution, exprType);
    const typeStr = typeToString(solvedType);

    console.log(`${expression} : ${typeStr}`);
  } catch (error) {
    console.error(`Type error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}

async function main(): Promise<void> {
  const args = Deno.args;

  // No arguments - start REPL
  if (args.length === 0) {
    const repl = new REPL();
    await repl.run();
    return;
  }

  const firstArg = args[0];

  // Help
  if (firstArg === "-h" || firstArg === "--help") {
    printUsage();
    return;
  }

  // Evaluate code directly
  if (firstArg === "-e") {
    if (args.length < 2) {
      console.error("Error: -e requires code argument");
      printUsage();
      Deno.exit(1);
    }
    await evaluateCode(args[1]);
    return;
  }

  // Show type
  if (firstArg === "-t") {
    if (args.length < 2) {
      console.error("Error: -t requires expression argument");
      printUsage();
      Deno.exit(1);
    }
    showType(args[1]);
    return;
  }

  // Run file
  if (!firstArg.startsWith("-")) {
    await runFile(firstArg);
    return;
  }

  // Unknown option
  console.error(`Error: Unknown option '${firstArg}'`);
  printUsage();
  Deno.exit(1);
}

// Run the CLI
if (import.meta.main) {
  main().catch((error) => {
    console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  });
}
