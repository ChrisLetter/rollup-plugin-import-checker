import rollupPluginImportChecker from "../src/index.js";
import { rollup } from "rollup";
import { genExport } from "knitwork";
import { unlinkSync, writeFileSync } from "fs";
import { consola } from "consola";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { type Mock } from "vitest";

vi.mock("consola", () => ({
  consola: {
    warn: vi.fn().mockImplementation(() => {}),
    error: vi.fn().mockImplementation(() => {}),
  },
}));

const targetFile = ".tmp.js";
afterAll(() => {
  unlinkSync(targetFile);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("Rollup Plugin Import Checker", () => {
  describe("Main Scenarios", () => {
    it("should warn with a default message when a target import is detected", async () => {
      writeFileSync(targetFile, genExport("consola", ["consola"]));

      await rollup({
        input: targetFile,
        plugins: [
          nodeResolve(),
          rollupPluginImportChecker([{ source: "consola" }]),
        ],
      });

      expect(consola.warn).toHaveBeenCalledOnce();
      expect(consola.warn).toHaveBeenCalledWith(
        `An import for "consola" was detected from "${targetFile}"`,
      );
    });

    it("should now warn when a target import is not detected", async () => {
      writeFileSync(targetFile, genExport("consola", ["consola"]));

      await rollup({
        input: targetFile,
        plugins: [
          nodeResolve(),
          rollupPluginImportChecker([{ source: "path" }]),
        ],
      });

      expect(consola.warn).not.toHaveBeenCalled();
    });

    it("should warn multiple times if more than one target is found", async () => {
      writeFileSync(
        targetFile,
        genExport("consola", ["consola"]).concat(
          genExport("path", ["relative"]),
        ),
      );

      await rollup({
        input: targetFile,
        plugins: [
          nodeResolve(),
          rollupPluginImportChecker([
            { source: "consola" },
            { source: "path" },
          ]),
        ],
      });

      expect(consola.warn).toHaveBeenCalledTimes(2);
      expect((consola.warn as unknown as Mock).mock.calls).toEqual([
        [`An import for "consola" was detected from "${targetFile}"`],
        [`An import for "path" was detected from "${targetFile}"`],
      ]);
    });
  });

  describe("Options", () => {
    it("should allow to customize the severity of the log", async () => {
      writeFileSync(targetFile, genExport("consola", ["consola"]));

      await rollup({
        input: targetFile,
        plugins: [
          nodeResolve(),
          rollupPluginImportChecker([{ source: "consola", severity: "error" }]),
        ],
      });

      expect(consola.error).toHaveBeenCalled();
    });

    it("should allow to customize the message of the log", async () => {
      writeFileSync(targetFile, genExport("consola", ["consola"]));

      await rollup({
        input: targetFile,
        plugins: [
          nodeResolve(),
          rollupPluginImportChecker([
            {
              source: "consola",
              message: (source, importer) =>
                `Hey, you imported ${source} from ${importer}`,
            },
          ]),
        ],
      });

      expect(consola.warn).toHaveBeenCalledWith(
        `Hey, you imported consola from ${targetFile}`,
      );
    });

    it("should allow to specify a pattern to match the importer", async () => {
      writeFileSync(targetFile, genExport("consola", ["consola"]));

      await rollup({
        input: targetFile,
        plugins: [
          nodeResolve(),
          rollupPluginImportChecker([
            { source: "consola", match: [{ pattern: "src/*" }] },
          ]),
        ],
      });

      expect(consola.warn).not.toHaveBeenCalled();
    });

    it("should allow to throw an error when a target import is detected", async () => {
      writeFileSync(targetFile, genExport("consola", ["consola"]));

      const rollupPromise = rollup({
        input: targetFile,
        plugins: [
          nodeResolve(),
          rollupPluginImportChecker([{ source: "consola", throwError: true }]),
        ],
      });

      await expect(rollupPromise).rejects.toThrow();
    });
  });
});
