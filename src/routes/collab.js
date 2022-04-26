import { Router } from "express";
import add_collab from "../../utils/add_collab.js";
import {
  existsSync,
  writeFileSync,
  readFileSync,
  join,
  __rootname,
} from "../../utils/io.js";

const router = Router();

router.get("/", (req, res) => {});
router.post("/", async (req, res) => {
  const { id, url, notification } = req.body;

  // data is null
  if (!id && !url) {
    res.status(400).send({
      status: "error",
      message: "Please provide id/url youtube video",
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

  const data = await add_collab(youtubeId, notification);

  if (typeof data === "string") {
    // show error
    return res.status(400).send({
      status: "error",
      message: data,
    });
  }

  // status when post success
  res.status(201).json({
    status: "success",
    message: "Collab added",
    data,
  });
});

export default router;
