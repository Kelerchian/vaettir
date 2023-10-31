import * as fs from "fs";
import { globSync } from "glob";
import { TEST_CJS_DIR, TEST_FILE_EXTENSIONS } from "./commonjs-common.js";

TEST_FILE_EXTENSIONS.map((testFileExtension) => {
  globSync(`${TEST_CJS_DIR}/**/*${testFileExtension}`, {
    ignore: ["**/jest.config.ts", "**/node_modules/**/*"],
  }).forEach((file) => fs.unlinkSync(file));
});
