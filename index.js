import figlet from "figlet";
import gradient from "gradient-string";
import "dotenv/config";
import server from "./src/index.js";

import video_runner from "./utils/video_runner.js";

console.log("\x1Bc");
figlet(`Re:Morable API`, (err, data) => {
  console.log(gradient.rainbow(data));
});

await new Promise(resolve => setTimeout(resolve, 500));
await video_runner();

server();
