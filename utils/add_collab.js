import chalk from "chalk";
import moment from "moment";
import getVideo from "./fetch_video/get_data_video.js";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  join,
  __rootname,
  readFileSync,
} from "./io.js";

export default async (youtubeId, notif = false) => {
  // create collab.json in members folder
  if (!existsSync(join(__rootname, "members")))
    mkdirSync(join(__rootname, "members"));
  if (!existsSync(join(__rootname, "members/collab.json")))
    writeFileSync(join(__rootname, "members/collab.json"), "[]");

  // get collab.json
  let video_collabs = JSON.parse(
    readFileSync(join(__rootname, "members/collab.json"), "utf8")
  );
  let video_data;

  if (video_collabs.find(v => v.id === youtubeId))
    return `${youtubeId} is arleady exist!`;

  try {
    // get data from youtube
    video_data = await getVideo({ video_id: youtubeId, collab: true });
  } catch (error) {
    return error.message;
  }

  if (video_data == null) return `${youtubeId} not exist!`;
  if (video_data.to == null)
    return `${youtubeId} is not Re:memories members collab`;

  // check live status
  switch (video_data.live_status) {
    case "upcoming":
      // compile start_stream to time now
      const time_remain = moment(video_data.live.start_stream).isBefore(
        Date.now()
      )
        ? "in few moments"
        : moment(video_data.live.start_stream).fromNow();

      console.log(
        chalk.blue.inverse.bold(
          ` 🎬 Staring ${time_remain} ${video_data.from.name_channel} `
        ) + video_data.title
      );
      // checkNotification(video_data.live_status, member.slug, video_data);
      break;
    case "live":
      console.log(
        chalk.red.bold.inverse(
          ` 🔴 Now live! ${video_data.from.name_channel} `
        ) + video_data.title
      );
      // checkNotification(video_data.live_status, member.slug, video_data);
      break;
    default:
      console.log(
        chalk.green.inverse.bold(
          ` 📺 New video! ${video_data.from.name_channel} `
        ) + video_data.title
      );
      // if (notif)
      // checkNotification(video_data.live_status, member.slug, video_data);
      break;
  }

  // push video data
  video_collabs.push(video_data);

  // sorting video_collabs by start_stream (when exist) or published
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
  // limit video_collabs to 30
  video_collabs = video_collabs.slice(0, 30);

  // write collab.json
  writeFileSync(
    join(__rootname, "members/collab.json"),
    JSON.stringify(video_collabs)
  );

  return video_data;
};
