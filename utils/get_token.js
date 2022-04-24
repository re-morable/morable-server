import { createSpinner } from "nanospinner";
import { google } from "googleapis";
import chalk from "chalk";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __rootname = path.dirname(__filename) + "/../";

export default async () => {
  const spinner = createSpinner(
    chalk.blue.bold.inverse(" Find token.json ")
  ).start();

  const token_json = path.join(__rootname, "config/token.json");

  if (!fs.existsSync(token_json)) {
    spinner.error({
      text: chalk.red.bold.inverse(" 😥 token.json file not found! "),
    });
    process.exit(1);
  }

  // read tokens in array
  const tokens = JSON.parse(fs.readFileSync(token_json, "utf8"));
  let token_api = null;

  // loop tokens with index
  for (const [i, token] of tokens.entries()) {
    if (token_api) continue;

    spinner.update({
      text: chalk.blue.bold.inverse(` Check token-${i + 1} `),
    });

    const youtube = google.youtube({
      version: "v3",
      auth: token,
    });

    // get video
    const check_token = await youtube.videos
      .list({
        id: "iNRrOsEHKyo",
        part: "snippet",
      })
      .then(res => res.data.items)
      .catch(err => null);

    if (check_token) {
      token_api = token;
      break;
    }
  }

  // error all token max limit
  if (!token_api) {
    spinner.error({
      text: chalk.red.bold.inverse(" 😥 All token in max limit! "),
    });
    process.exit(1);
  }

  spinner.success({ text: chalk.green.bold.inverse(" 😄 Token found! ") });
  return token_api;
};
