import {
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const sleep = async (ms = 1000) =>
  await new Promise(resolve => setTimeout(resolve, ms));

const __filename = fileURLToPath(import.meta.url);
const __rootname = dirname(__filename) + "/../";

export {
  __rootname,
  join,
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
  mkdirSync,
};
