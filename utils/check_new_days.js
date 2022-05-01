import moment from "moment";
import { readFileSync, join, __rootname } from "./io.js";
import { app } from "./init_firebase.js";
import { getMessaging } from "firebase-admin/messaging";

const fcm = getMessaging(app);

export default () => {
  // get members.json
  const members = JSON.parse(
    readFileSync(join(__rootname, "config", "members.json"))
  );

  setInterval(() => {
    const now = moment().utcOffset("+07:00");
    const isBirthday = now.format("MMMM D").toLowerCase();

    // get year of today
    const year = now.format("YYYY");
    // then 29th of February is existed
    const the29feb = moment(`${year}-02-29`, "YYYY-MM-DD").isValid();
    // check when now 1st of March
    const is1stMarch = now.format("MMMM D").toLowerCase() === "march 1";

    const is7am = now.hour() === 7 && now.minute() === 0;
    const is12pm = now.hour() === 12 && now.minute() === 0;

    // check birthday
    for (const member of members) {
      const hbd =
        member.birthday &&
        member.birthday.toLowerCase() === isBirthday &&
        is7am;
      const chloe1march =
        member.slug === "chloe" && !the29feb && is1stMarch && is7am;
      if (hbd || chloe1march) {
        // send notification
        fcm.send({
          topic: "birthday",
          notification: {
            title: `Hari ini ${member.name} ulang tahun`,
            body: `Kami dari Re:Morable mengucapkan selamat ulang tahun kepada ${member.name}`,
          },
          android: {
            priority: "high",
          },
        });
      }
    }
  }, 1000 * 60);
};
