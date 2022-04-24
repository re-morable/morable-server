import { Router } from "express";
import {
  existsSync,
  writeFileSync,
  readFileSync,
  join,
  __rootname,
} from "../../utils/io.js";
const router = Router();

router.get("/", (req, res) => {});
router.post("/", (req, res) => {
  const { id, url, member } = req.body;

  // data is null
  if ((!id || !url) && !member) {
    res.status(400).send({
      status: "error",
      message: "Please provide id/url youtube and member slug",
    });
  }

  // check when id and url filled
  if (id && url) {
    res.status(400).send({
      status: "error",
      message: "Cannot provide id and url in the same field",
    });
  }

  // check url is youtube url
  const isYoutubeUrl =
    /(?:(?:http(?:s)?:\/\/)?(?:www|m)?(?:.)?)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9-_]{11})/gi;

  if (url && !url.match(isYoutubeUrl)) {
    res.status(400).send({
      status: "error",
      message: "Please provide youtube url",
    });
  }

  // check id is id video from youtube url
  const isYoutubeId = id?.match(/^[a-zA-Z0-9_-]{11}$/g);

  if (id && !isYoutubeId) {
    res.status(400).send({
      status: "error",
      message: "Please provide youtube id",
    });
  }

  // get youtube id from url
  const youtubeId = id ? id : url.replace(isYoutubeUrl, "$1");
  console.log(youtubeId);

  // check member slug is string or array
  const members = typeof member === "string" ? [member] : member;

  // get slug member from config/members.js
  const slugs = JSON.parse(
    readFileSync(join(__rootname, "config/members.json"))
  ).map(member => member.slug);

  for (const member of members) {
    if (!slugs.includes(member)) {
      return res.status(400).send({
        status: "error",
        message: `${member} is not members of Re:memories`,
      });
    }
  }

  // create config/collab.json when not found
  const collab_json = join(__rootname, "config/collab.json");

  if (!existsSync(collab_json)) {
    writeFileSync(collab_json, "[]");
  }

  // read config/collab.json
  const collab = JSON.parse(readFileSync(collab_json, "utf8"));

  // push data to collab.json
  collab.push({ id: youtubeId, to: members });

  // write collab.json
  writeFileSync(collab_json, JSON.stringify(collab));

  // status when post success
  res.status(201).json({
    status: "success",
    message: "Collab added",
    data: { id: youtubeId, to: members },
  });
});

export default router;
