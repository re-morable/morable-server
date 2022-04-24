import chalk from "chalk";
import get_token from "./get_token.js";
import fetchVideos from "./fetch_videos.js";

const sleep = async (ms = 1000) =>
  await new Promise(resolve => setTimeout(resolve, ms));

import { google } from "googleapis";

let youtube;

export default async () => {
  youtube = await getYouTubeToken();
  try {
    console.log(
      chalk.yellow.inverse.bold(` ${new Date().toLocaleString()} `) +
        chalk.blue.inverse.bold(` 🔍 Get data... `)
    );
    await fetchVideos(youtube);
  } catch (error) {
    if (
      error.errors?.length > 0 &&
      error.errors[0]?.reason === "quotaExceeded"
    ) {
      console.log(
        chalk.red.bold.inverse(" 🤐 Quota exceeded, get new token! ")
      );
      youtube = getYouTubeToken(youtube);
    } else {
      console.log(chalk.red.bold.inverse(" 😥 Error: "), error.message);
      console.log(error);
      process.exit(1);
    }
  }
  setInterval(async () => {
    try {
      console.log(
        chalk.yellow.inverse.bold(` ${new Date().toLocaleString()} `) +
          chalk.blue.inverse.bold(" 🔍 Refresh data... ")
      );
      await fetchVideos(youtube, true);
    } catch (error) {
      if (
        error.errors?.length > 0 &&
        error.errors[0]?.reason === "quotaExceeded"
      ) {
        console.log();
        console.log(
          chalk.red.bold.inverse(" 🤐 Quota exceeded, get new token! ")
        );
        youtube = getYouTubeToken();
      } else {
        console.log();
        console.log(chalk.red.bold.inverse(" 😥 Error: "), error.message);
        process.exit(1);
      }
    }
  }, 1000 * 60);
};

// check api limit
async function getYouTubeToken() {
  return google.youtube({
    version: "v3",
    auth: await get_token(),
  });
}
