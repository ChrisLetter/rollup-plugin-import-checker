import { consola, type LogType } from "consola";
import { minimatch, type MinimatchOptions } from "minimatch";
import { relative } from "path";
import type { Plugin, RollupError } from "rollup";

// interfaces
interface DefaultOptions {
  message: (source: string, importer?: string) => string;
  severity: LogType;
}
export interface ImportCheckerOptions {
  source: string;
  message?: (source: string, importer?: string) => string;
  severity?: LogType;
  match?: { pattern: string; options?: MinimatchOptions }[];
  throwError?: boolean;
}

// default options
const defaultOptions: DefaultOptions = {
  message: (source, importer) =>
    importer
      ? `An import for "${source}" was detected from "${importer}"`
      : `An import for "${source}" was detected`,
  severity: "warn",
};

export default function rollupPluginImportChecker(
  options: ImportCheckerOptions[],
): Plugin {
  const importsToMonitor = options.map((option) => option.source);
  // changing the shape of the options to make it easier to work with
  const config: { [key: string]: ImportCheckerOptions } = {};
  for (const option of options) {
    config[option.source] = option;
  }

  return {
    name: "rollup-plugin-import-checker",
    resolveId: {
      order: "pre",
      handler(source, importer) {
        if (!importsToMonitor.includes(source)) {
          return;
        }

        const option = config[source] as ImportCheckerOptions;

        // removing process.cwd() from the importer to make it nicer to read in the logs
        const relativeImporter = importer
          ? relative(process.cwd(), importer)
          : undefined;

        // ignore the import if it doesn't match the pattern provided
        if (option?.match && relativeImporter) {
          const matched = option.match.some((match) =>
            minimatch(relativeImporter, match.pattern, match.options),
          );
          if (!matched) {
            return;
          }
        }

        const message = option.message
          ? option.message(source, relativeImporter)
          : defaultOptions.message(source, relativeImporter);
        const severity = option.severity || defaultOptions.severity;

        consola[severity](message);

        if (option.throwError) {
          const error: RollupError = new Error(message);
          error.plugin = "rollup-plugin-import-checker";
          error.code = "IMPORT_CHECKER_ERROR";
          this.error(error);
        }
      },
    },
  };
}
