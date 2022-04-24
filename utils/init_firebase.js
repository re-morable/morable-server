import { applicationDefault, initializeApp } from "firebase-admin/app";
import { env } from "process";
import { join, __rootname, readFileSync, existsSync } from "./io.js";

const fbJSON = join(__rootname, "config/firebase-admin.json");
if (!existsSync(fbJSON)) {
  console.log(
    chalk.red.bold.inverse(" 😥 firebase-admin.json file not found! ")
  );
  process.exit(1);
}

// set env GOOGLE_APPLICATION_CREDENTIALS
process.env.GOOGLE_APPLICATION_CREDENTIALS = fbJSON;

const app = initializeApp({
  credential: applicationDefault(),
});
export { app };
