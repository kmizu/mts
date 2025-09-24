// Module loader for MTS - resolves imports, performs type inference, and evaluates modules

import { Parser } from "./parser.ts";
import { Expression, ImportDeclaration, Program, VariableDeclaration } from "./ast.ts";
import { TypeEnv, TypeScheme } from "./types.ts";
import { TypeInferrer } from "./infer.ts";
import { Evaluator, RuntimeValue } from "./evaluator.ts";

export interface ModuleRecord {
  path: string;
  program: Program;
  typeEnv: TypeEnv;
  typeExports: Map<string, TypeScheme>;
  valueExports: Map<string, RuntimeValue>;
  lastValue: RuntimeValue;
}

function cloneTypeScheme(scheme: TypeScheme): TypeScheme {
  // structuredClone is available in modern runtimes and retains object graphs for plain data
  return structuredClone(scheme);
}

function hasExtension(path: string): boolean {
  const segments = path.split("/");
  const last = segments[segments.length - 1];
  return last.includes(".");
}

export class ModuleLoader {
  private cache = new Map<string, ModuleRecord>();
  private loading = new Set<string>();

  constructor(private readonly defaultExtension = ".mts") {}

  async loadModule(path: string): Promise<ModuleRecord> {
    const normalizedPath = await this.normalizePath(path);

    if (this.cache.has(normalizedPath)) {
      return this.cache.get(normalizedPath)!;
    }

    const source = await Deno.readTextFile(normalizedPath);
    return await this.processModule(normalizedPath, source);
  }

  async loadModuleFromSource(path: string, source: string): Promise<ModuleRecord> {
    const normalizedPath = hasExtension(path) ? path : `${path}${this.defaultExtension}`;

    // Remove potential stale cache for dynamic sources
    this.cache.delete(normalizedPath);
    return await this.processModule(normalizedPath, source);
  }

  private async processModule(path: string, source: string): Promise<ModuleRecord> {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    if (this.loading.has(path)) {
      throw new Error(`Circular import detected for module '${path}'`);
    }

    this.loading.add(path);

    try {
      const parser = new Parser(source);
      const parsedProgram = parser.parse();
      const { imports, expressions } = this.separateProgram(parsedProgram);

      const typeImports = new Map<string, TypeScheme>();
      const valueImports = new Map<string, RuntimeValue>();

      for (const importDecl of imports) {
        const resolvedPath = await this.resolveSpecifier(importDecl.source, path);
        const dependency = await this.loadModule(resolvedPath);

        for (const specifier of importDecl.specifiers) {
          const exportedType = dependency.typeExports.get(specifier.imported);
          if (!exportedType) {
            throw new Error(
              `Module '${importDecl.source}' does not export '${specifier.imported}' (imported from '${path}')`,
            );
          }
          const exportedValue = dependency.valueExports.get(specifier.imported);
          if (exportedValue === undefined) {
            throw new Error(
              `Module '${importDecl.source}' is missing runtime export '${specifier.imported}'`,
            );
          }

          typeImports.set(specifier.local, cloneTypeScheme(exportedType));
          valueImports.set(specifier.local, exportedValue);
        }
      }

      const program: Program = {
        kind: "Program",
        body: expressions,
      };

      const inferrer = new TypeInferrer();
      const baseEnv = inferrer.createInitialEnv();
      for (const [name, scheme] of typeImports) {
        baseEnv.set(name, scheme);
      }
      const inferredEnv = inferrer.infer(program, baseEnv);

      const evaluator = new Evaluator();
      for (const [name, value] of valueImports) {
        evaluator.setGlobal(name, value);
      }
      const lastValue = evaluator.evaluate(program);

      const exportNames = this.collectExports(expressions);
      const typeExports = new Map<string, TypeScheme>();
      const valueExports = new Map<string, RuntimeValue>();

      for (const name of exportNames) {
        const scheme = inferredEnv.get(name);
        if (!scheme) {
          continue; // Skip bindings that were not retained in the environment (shouldn't happen)
        }
        typeExports.set(name, cloneTypeScheme(scheme));
        valueExports.set(name, evaluator.getGlobalValue(name));
      }

      const envClone: TypeEnv = new Map();
      for (const [name, scheme] of inferredEnv) {
        envClone.set(name, cloneTypeScheme(scheme));
      }

      const record: ModuleRecord = {
        path,
        program,
        typeEnv: envClone,
        typeExports,
        valueExports,
        lastValue,
      };

      this.cache.set(path, record);
      return record;
    } finally {
      this.loading.delete(path);
    }
  }

  private separateProgram(program: Program): {
    imports: ImportDeclaration[];
    expressions: Expression[];
  } {
    const imports: ImportDeclaration[] = [];
    const expressions: Expression[] = [];

    for (const node of program.body) {
      if ((node as ImportDeclaration).kind === "ImportDeclaration") {
        imports.push(node as ImportDeclaration);
      } else {
        expressions.push(node as Expression);
      }
    }

    return { imports, expressions };
  }

  private collectExports(expressions: Expression[]): string[] {
    const names: string[] = [];
    for (const expr of expressions) {
      if (expr.kind === "VariableDeclaration") {
        const decl = expr as VariableDeclaration;
        for (const binding of decl.bindings) {
          names.push(binding.identifier.name);
        }
      }
    }
    return names;
  }

  private async normalizePath(path: string): Promise<string> {
    const withExtension = hasExtension(path) ? path : `${path}${this.defaultExtension}`;
    return await Deno.realPath(withExtension);
  }

  private async resolveSpecifier(specifier: string, fromPath: string): Promise<string> {
    if (!specifier.startsWith(".")) {
      throw new Error(
        `Only relative import specifiers are currently supported (in '${fromPath}'): '${specifier}'`,
      );
    }

    const baseUrl = new URL(`file://${fromPath}`);
    const normalizedSpecifier = hasExtension(specifier)
      ? specifier
      : `${specifier}${this.defaultExtension}`;
    const resolvedUrl = new URL(normalizedSpecifier, baseUrl);
    const resolvedPath = decodeURIComponent(resolvedUrl.pathname);
    return await Deno.realPath(resolvedPath);
  }
}
