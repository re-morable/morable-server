import chalk from "chalk";
import moment from "moment";
import { createSpinner } from "nanospinner";
import {
  __rootname,
  existsSync,
  readFileSync,
  join,
  writeFileSync,
} from "./io.js";

import getVideo from "./fetch_video/get_data_video.js";

import { app } from "./init_firebase.js";
import { getFirestore } from "firebase-admin/firestore";
const db = getFirestore(app);

// import checkNotification from "./check-notification.js";

const sleep = async (ms = 1000) =>
  await new Promise(resolve => setTimeout(resolve, ms));

export default async () => {
  const spinner = createSpinner();

  // find collab.json
  spinner.start({ text: chalk.blue.bold(" 🔍 Find collab.json ") });
  await sleep(500);

  const collab_json = join(__rootname, "members/collab.json");

  if (!existsSync(collab_json)) {
    spinner.error({
      text: chalk.green.bold(
        ` 😐 No collab data for now (${new Date().toLocaleString()}) `
      ),
    });
    return;
  }

  // convert members.json to array
  let video_collabs = JSON.parse(readFileSync(collab_json, "utf8"));

  // looping video collabs

  for (let video of video_collabs) {
    // check when start_stream is passted, but still in upcoming status
    const past_upcoming =
      moment(video.live?.start_stream).isBefore(new Date().getTime()) &&
      video.live_status === "upcoming";

    // check when video is live
    const is_live = video.live_status === "live";

    // check when update_time + 1day is passted
    const past_update = moment(video.update_time)
      .add(1, "d")
      .isBefore(new Date().getTime());

    spinner.update({
      text: chalk.blue.bold(
        ` 🔍 Collab Videos 👥: Check video "${video.title}"... `
      ),
    });

    if (!past_upcoming && !is_live && !past_update) continue;

    // get video data
    const video_data = await getVideo({
      video_id: video.id,
      collab: true,
    });

    // check when video_data return null and pop
    if (!video_data) {
      video_collabs = video_collabs.filter(v => v.id !== video.id);
      continue;
    }

    // check change live status
    if (video.live_status === "upcoming" && video_data.live_status === "live") {
      spinner.clear();
      console.log(
        chalk.red.bold.inverse(
          ` 🔴 Now live! ${video_data.from.name_channel} `
        ) + video_data.title
      );
      spinner.start();
      // checkNotification(video_data.live_status, member.slug, video_data);
    } else if (
      video.live_status === "live" &&
      video_data.live_status === "none"
    ) {
      spinner.clear();
      console.log(
        chalk.red.bold.inverse(
          ` 🛑 Live End ${video_data.from.name_channel} `
        ) + video_data.title
      );
      spinner.start();
    }

    // update video data
    video_collabs = video_collabs.map(v => {
      if (v.id === video.id) return video_data;
      return v;
    });
  }

  // sorting data by start_stream (when exist) or published
  video_collabs.sort((a, b) => {
    if (a.live?.start_stream && b.live?.start_stream) {
      return b.live.start_stream - a.live.start_stream;
    } else if (a.live?.start_stream) {
      return -1;
    } else if (b.live?.start_stream) {
      return 1;
    } else {
      return b.published - a.published;
    }
  });
  // limit data to 30
  video_collabs = video_collabs.slice(0, 30);
  // save to (slug).json
  writeFileSync(collab_json, JSON.stringify(video_collabs));

  if (video_collabs.length > 0) {
    spinner.success({
      text: chalk.green.bold(
        ` 🎉 All collab videos success fetched (${new Date().toLocaleString()}) `
      ),
    });
  } else {
    spinner.error({
      text: chalk.green.bold(
        ` 😐 No collab data for now (${new Date().toLocaleString()}) `
      ),
    });
  }
};
