import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ModuleLoader } from "../src/module_loader.ts";

Deno.test("ModuleLoader resolves imports and evaluates modules", async () => {
  const loader = new ModuleLoader();
  const entryPath = `${await Deno.realPath("tests/modules/entry.mts")}`;
  const record = await loader.loadModule(entryPath);

  assertEquals(record.lastValue, {
    alias: 6,
    triple: 6,
    quad: 8,
  });

  assertEquals(record.valueExports.get("aliasResult"), 6);
  assertEquals(record.valueExports.get("tripleResult"), 6);
  assertEquals(record.valueExports.get("quadResult"), 8);
  assertEquals(record.valueExports.get("summary"), {
    alias: 6,
    triple: 6,
    quad: 8,
  });

  const mathPath = `${await Deno.realPath("tests/modules/math.mts")}`;
  const mathRecord = await loader.loadModule(mathPath);
  assertEquals((mathRecord.valueExports.get("double") as any).kind, "function");
  assertEquals((mathRecord.valueExports.get("triple") as any).kind, "function");
});

Deno.test("ModuleLoader reports missing exports", async () => {
  const loader = new ModuleLoader();
  const moduleDir = await Deno.realPath("tests/modules");
  await assertRejects(
    () =>
      loader.loadModuleFromSource(
        `${moduleDir}/broken.mts`,
        'import { missing } from "./math.mts"; missing',
      ),
    Error,
    "does not export",
  );
});
