//import Tiktok from "@xct007/tiktok-scraper";
const Tiktok = require("@xct007/tiktok-scraper");

Tiktok("https://www.tiktok.com/@nuch2_1music/live", {
    // Without parse option
    // The raw data will be returned
    parse: false,
  })
  .then((data) => {
    console.log("Aweme List:", data);
  })
  .catch((error) => {
    console.error(error);
  });