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

  // find a active token
  const token_api = tokens.find(async (token, index) => {
    spinner.update({
      text: chalk.blue.bold.inverse(` Check token-${index + 1} `),
    });

    const youtube = google.youtube({
      version: "v3",
      auth: token,
    });

    // get video
    const check_token = await youtube.videos.list({
      id: "iNRrOsEHKyo",
      part: "snippet",
    });

    // check token not return error
    if (check_token.data.items) return token;
  });

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
