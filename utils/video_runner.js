import chalk from "chalk";
import get_token from "./get_token.js";
import fetchVideos from "./fetch_members.js";
import checkCollab from "./check_collab.js";

const sleep = async (ms = 1000) =>
  await new Promise(resolve => setTimeout(resolve, ms));

export default async () => {
  await get_token();
  try {
    console.log(
      chalk.yellow.inverse.bold(` ${new Date().toLocaleString()} `) +
        chalk.blue.inverse.bold(` 🔍 Get data... `)
    );

    await fetchVideos();
    await checkCollab();
  } catch (error) {
    if (error.message == "quotaExceeded") {
      console.log(
        chalk.red.bold.inverse(" 🤐 Quota exceeded, get new token! ")
      );
      get_token();
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
      await fetchVideos(true);
      await checkCollab();
    } catch (error) {
      if (error.message == "quotaExceeded") {
        console.log();
        console.log(
          chalk.red.bold.inverse(" 🤐 Quota exceeded, get new token! ")
        );
        get_token();
      } else {
        console.log();
        console.log(chalk.red.bold.inverse(" 😥 Error: "), error.message);
        process.exit(1);
      }
    }
  }, 1000 * 60);
};
