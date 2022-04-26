import { youtube } from "googleapis/build/src/apis/youtube/index.js";
import { __rootname, readFileSync, join } from "./../io.js";

export default async ({ video_id, slug = null, collab = false }) => {
  // read token from txt
  const token = readFileSync(join(__rootname, "config/token.txt"), "utf8");

  const yt = youtube({
    version: "v3",
    auth: token,
  });

  // fetch video from api
  const video = await yt.videos
    .list({
      id: video_id,
      part: "statistics,snippet,liveStreamingDetails,contentDetails",
      fields:
        "items(snippet(publishedAt,title,description,channelId,channelTitle,liveBroadcastContent),liveStreamingDetails(scheduledStartTime,actualStartTime,actualEndTime),statistics(viewCount),contentDetails(duration))",
    })
    .then(data => data.data.items[0])
    .catch(err => {
      // when video is not found
      if (err.status === 404) return false;
      else if (err.errors[0]?.reason === "quotaExceeded")
        throw new Error(err.errors[0]?.reason);
      else throw new Error(err);
    });

  if (!video) return null;

  const published = new Date(video.snippet.publishedAt).getTime();
  const duration = convertToSeconds(video.contentDetails.duration);
  const update_time = new Date().getTime();

  // get members.json
  let members = JSON.parse(
    readFileSync(join(__rootname, "config/members.json"), "utf8")
  );
  // delete first array
  members = members.slice(1);
  // get name channel
  const name_channel = members.map(
    member => `${member.name} Ch.『 Re:Memories 』`
  );
  // get channel id
  const channel_id = members.map(member => member.id);
  // get slug
  const slug_channel = members.map(member => member.slug);

  let to = [];

  // loop
  for (const [index] of members.entries()) {
    if (
      (video.snippet.title.includes(name_channel[index]) ||
        video.snippet.description.includes(name_channel[index]) ||
        video.snippet.description.includes(channel_id[index])) &&
      to.find(slug => slug === slug_channel[index]) == null
    ) {
      to.push(slug_channel[index]);
    }
  }

  const from = collab
    ? {
        id_channel: video.snippet.channelId,
        name_channel: video.snippet.channelTitle,
      }
    : slug;

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
    description: video.snippet.description,
    published,
    from,
    to: to.length ? to : null,
    duration,
    update_time,
    live_status: video.snippet.liveBroadcastContent,
    ...live,
  };
};

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
