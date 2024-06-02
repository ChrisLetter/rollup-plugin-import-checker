# Rollup Plugin Import Checker

This plugin will check if a specified import is being used in the code, allowing you to create a custom message and stop the build (if specified). This is useful in large organizations when you want to enforce rules on the dependencies being used.

![example](https://github.com/ChrisLetter/rollup-plugin-import-checker/blob/main/img/example.png?raw=true)

## Vite Example

```javascript
import importChecker from "rollup-plugin-import-checker";

export default defineConfig({
  plugins: [
    rollupPluginImportChecker([
      {
        source: "vue-router",
        severity: "error",
        match: [{ pattern: "src/**", options: { nocase: true } }],
        message: (source, importer) =>
          `You are importing ${source} from ${importer}, please use the custom router instead`,
        throwError: false,
      },
    ]),
  ],
});
```

The plugin accepts an array of objects with the following properties:

- **source**: The name of the package or the import that you want to monitor. This is the only required property
- **severity**: The severity of the message, which can be any of the values that [consola](https://www.npmjs.com/package/consola) accepts. The default is `"warn"`.
- **match**: An array of objects with the patterns that you want to check, it uses [minimatch](https://www.npmjs.com/package/minimatch) to match the files, so you can use any of the options that minimatch accepts. The default is `"**"`
- **message**: A function that receives the source and the importer and returns the message that you want to show. The default is `(source, importer) => An import for "${source}" was detected from "${importer}"`.
- **throwError**: A boolean that specifies if you want to stop the build if the import is found. The default is `false`.
