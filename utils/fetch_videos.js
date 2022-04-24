import chalk from "chalk";
import moment from "moment";
import { createSpinner } from "nanospinner";
import {
  __rootname,
  existsSync,
  readFileSync,
  join,
  writeFileSync,
  mkdirSync,
} from "./io.js";

import { app } from "./init_firebase.js";
import { getFirestore } from "firebase-admin/firestore";
const db = getFirestore(app);

import Parser from "rss-parser";
const parser = new Parser();
// import checkNotification from "./check-notification.js";

const sleep = async (ms = 1000) =>
  await new Promise(resolve => setTimeout(resolve, ms));

export default async (youtube, notif = false) => {
  const spinner = createSpinner();

  // create members folder
  if (!existsSync(join(__rootname, "members"))) {
    spinner.start({
      text: chalk.blue.bold.inverse(" ✏️ Create members folder "),
    });
    await sleep(2000);
    mkdirSync(join(__rootname, "members"));
  }

  // find members.json
  spinner.start({ text: chalk.blue.bold(" 🔍 Find members.json ") });
  await sleep(500);

  const members_json = join(__rootname, "config/members.json");
  if (!existsSync(members_json)) {
    console.log(chalk.red.bold.inverse(" 😥 members.json file not found! "));
    process.exit(1);
  }

  // convert members.json to array
  const members = JSON.parse(readFileSync(members_json, "utf8"));

  // looping members
  for (const member of members) {
    // read video from channel id
    spinner.update({
      text: chalk.blue.bold(
        ` 🔍 Read video from ${member.name} ${member.emoji} `
      ),
    });

    // get video from youtube(rss)
    const videofeeds = await parser
      .parseURL(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${member.id}`
      )
      .then(feed =>
        feed.items.map(item => ({
          id: item.id.split(":").reverse()[0],
          slug: member.slug,
        }))
      );

    //find (slug).json and create if not found
    const data_json = join(__rootname, `members/${member.slug}.json`);

    if (!existsSync(data_json)) {
      spinner.update({
        text: chalk.blue.bold(` 📝 Create ${member.slug}.json file `),
      });
      await sleep(500);
      writeFileSync(data_json, "[]");
    }

    // read (slug).json
    let data = JSON.parse(readFileSync(data_json, "utf8"));

    // looping data for check live status
    spinner.update({
      text: chalk.blue.bold(
        ` 🔍 ${member.name} ${member.emoji}: Checking live status... `
      ),
    });

    for (let video of data) {
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
          ` 🔍 ${member.name} ${member.emoji}: Check video "${video.title}"... `
        ),
      });

      if (!past_upcoming && !is_live && past_update) continue;

      // get video data
      const video_data = await getVideo(video.id, video.from, youtube);

      // check when video_data return null and pop
      if (!video_data) {
        data = data.filter(v => v.id !== video.id);
        continue;
      }

      // check change live status
      if (
        video.live_status === "upcoming" &&
        video_data.live_status === "live"
      ) {
        spinner.clear();
        console.log(
          chalk.red.bold.inverse(` 🔴 Now live! ${member.emoji} `) +
            video_data.title
        );
        spinner.start();
        // checkNotification(video_data.live_status, member.slug, video_data);
      } else if (
        video.live_status === "live" &&
        video_data.live_status === "none"
      ) {
        spinner.clear();
        console.log(
          chalk.red.bold.inverse(` 🛑 Live End ${member.emoji} `) +
            video_data.title
        );
        spinner.start();
      }

      // update video data
      data = data.map(v => {
        if (v.id === video.id) return video_data;
        return v;
      });
    }

    // looping videofeeds for check new video/live
    spinner.update({
      text: chalk.blue.bold(
        ` 🔍 ${member.name} ${member.emoji}: Checking new video... `
      ),
    });

    for (const video of videofeeds) {
      // check video exist in data
      const video_exist = data.find(v => v.id === video.id);

      if (video_exist) continue;

      // get video data
      const video_data = await getVideo(video.id, video.slug, youtube);

      // check when video_data return null
      if (!video_data) continue;

      // check live status
      switch (video_data.live_status) {
        case "upcoming":
          const time_remain =
            moment(video_data.live?.start_stream).isAfter(
              new Date().getTime()
            ) - new Date().getTime()
              ? moment(video_data.live.start_time).toNow()
              : "few moments";
          spinner.clear();
          console.log(
            chalk.blue.inverse.bold(
              ` 🎬 Staring in ${time_remain} ${member.emoji} `
            ) + video_data.title
          );
          spinner.start();
          // checkNotification(video_data.live_status, member.slug, video_data);
          break;
        case "live":
          spinner.clear();
          console.log(
            chalk.red.bold.inverse(` 🔴 Now live! ${member.emoji} `) +
              video_data.title
          );
          spinner.start();
          // checkNotification(video_data.live_status, member.slug, video_data);
          break;
        default:
          spinner.clear();
          console.log(
            chalk.green.inverse.bold(` 📺 New video! ${member.emoji} `) +
              video_data.title
          );
          spinner.start();
          if (notif)
            // checkNotification(video_data.live_status, member.slug, video_data);
            break;
      }

      // push video data
      data.push(video_data);
    }

    // sorting data by start_stream (when exist) or published
    data.sort((a, b) => {
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
    // limit data to 50
    data = data.slice(0, 50);
    // save to (slug).json
    writeFileSync(data_json, JSON.stringify(data));
  }

  spinner.success({
    text: chalk.green.bold(` 🎉 Done! ${new Date().toLocaleString()} `),
  });
};

async function getVideo(video_id, slug, youtube) {
  const video = await youtube.videos
    .list({
      id: video_id,
      part: "statistics,snippet,liveStreamingDetails,contentDetails",
      fields:
        "items(snippet(publishedAt,title,channelTitle,liveBroadcastContent),liveStreamingDetails(scheduledStartTime,actualStartTime,actualEndTime),statistics(viewCount),contentDetails(duration))",
    })
    .then(data => data.data.items[0])
    .catch(err => {
      // when video is not found
      if (err.status === 404) return false;
      else throw new Error(err);
    });

  if (!video) return null;

  const published = new Date(video.snippet.publishedAt).getTime();
  const duration = convertToSeconds(video.contentDetails.duration);

  const update_time = new Date().getTime();

  const live = video.liveStreamingDetails
    ? {
        live: {
          start_stream: new Date(
            video.liveStreamingDetails.actualStartTime
              ? video.liveStreamingDetails.actualStartTime
              : video.liveStreamingDetails.scheduledStartTime
          ).getTime(),
          end_stream: video.liveStreamingDetails.actualEndTime
            ? new Date(video.liveStreamingDetails.actualEndTime).getTime()
            : null,
        },
      }
    : null;

  return {
    id: video_id,
    title: video.snippet.title,
    published,
    from: slug,
    duration,
    update_time,
    live_status: video.snippet.liveBroadcastContent,
    ...live,
  };
}

function convertToSeconds(time) {
  const reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const matches = reptms.exec(time);

  let totalseconds;
  if (matches === null) totalseconds = 0;
  else {
    const hours = parseInt(matches[1] ?? 0);
    const minutes = parseInt(matches[2] ?? 0);
    const seconds = parseInt(matches[3] ?? 0);
    totalseconds = hours * 3600 + minutes * 60 + seconds;
  }

  return totalseconds;
}
