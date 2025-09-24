# Repository Guidelines

## Project Structure & Module Organization

- `src/` contains the language core: lexer/parser (`lexer.ts`, `parser.ts`), type inference
  (`infer.ts`), evaluator, REPL, and CLI wiring.
- `tests/` mirrors the core modules with targeted `*_test.ts` suites covering lexer, parser,
  inference edge cases, and runtime behavior.
- `examples/` hosts runnable `.mts` scripts; keep new samples small and documented in the README
  when relevant.
- `main.ts` exposes the CLI entry point used by tasks; update alongside `src/cli.ts` changes.

## Build, Test, and Development Commands

- `deno task dev` watches `src/` for edits and restarts the CLI—use during feature work.
- `deno task start [file|flags]` runs the interpreter with file input, inline code (`-e`), or
  type-check mode (`-t`).
- `deno task repl` launches the interactive shell; perfect for smoke-testing new language features.
- `deno task fmt` and `deno task lint` enforce formatting and static checks before reviews.
- `deno task test` executes the full suite with read/write permissions; add `--coverage` when
  validating regressions.

## Coding Style & Naming Conventions

- TypeScript under `compilerOptions.strict` is mandatory; fix type errors instead of suppressing
  them.
- Formatting follows `deno fmt` defaults: two-space indentation, 100-character lines, double quotes;
  avoid hand-formatting.
- Prefer descriptive camelCase for variables/functions and PascalCase for exported types; align
  module names with their primary class or function.
- Keep side effects isolated in CLI/repl modules; core evaluators should remain pure and
  deterministic.

## Testing Guidelines

- Co-locate new tests in the matching `tests/<module>_test.ts`; mimic existing naming such as
  `infer_edge_cases_test.ts` for complex scenarios.
- Use `Deno.test` with explicit descriptions (`"infers record row types"`) to aid CI triage.
- Expand fixtures via helper functions instead of large literals; prioritize coverage for new syntax
  and failure paths.
- Run `deno task test` before pushing; include coverage output when substantial interpreter logic
  changes.

## Commit & Pull Request Guidelines

- Follow the repository pattern: single-sentence present-tense summaries (often Japanese) describing
  the change, e.g. `parserの配列リテラルを拡張`.
- Squash local work before raising a PR; each PR should link any related issue and describe
  user-visible language effects.
- Highlight testing evidence (`deno task test`) in the PR description; attach REPL transcripts or
  example scripts when behavior changes.

## Security & Configuration Tips

- Deno tasks request read/write access; avoid broad `--allow-net` unless the feature demands
  external I/O.
- Check in configuration changes (`deno.json`, lint rules) separately from feature code to ease
  review.
