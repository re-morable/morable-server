import express from "express";
import sharp from "sharp";
import axios from "axios";

const app = express();

const server = () => {
  app.get("/", async (req, res) => {
    const thumbnail = "https://i.ytimg.com/vi/iNRrOsEHKyo/maxresdefault.jpg";

    const response = await axios.get(thumbnail, {
      responseType: "arraybuffer",
    });
    const buffer = Buffer.from(response.data, "base64");

    //reszise image to 360p
    const image = sharp(buffer).resize(640, 360).jpeg({ quality: 80 });

    // show image
    image.toBuffer().then(data => {
      console.log(data.toString("base64"));
      return res.set("Content-Type", "image/jpeg").send(data);
    });
  });

  app.listen(3000, () => {
    console.log("Example app listening on port 3000!");
  });
};

export default server;
