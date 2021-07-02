require("dotenv").config();
const log = require("skog");
const { writeActivities } = require("../lib");

async function start() {
  log.info("Hello world");
  const startDate = new Date("2021-05-10T23:15:30");
  const endDate = new Date("2021-05-10T23:15:30");

  await writeActivities(startDate, endDate, "/tmp/activities/");
}

start();
