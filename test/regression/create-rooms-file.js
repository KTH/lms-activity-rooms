require("dotenv").config();

// Make sure that the tests pass even if I have minor local differences in the settings
process.env.BLUEPRINT_SIS_ID = "exam_bp_2020_p0";

const test = require("ava");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { writeActivities } = require("../../lib");

const dir = fs.promises.mkdtemp(path.join(os.tmpdir(), "exams-"));
const start = new Date("August 1, 2020 23:15:30");
const end = new Date("August 15, 2020 23:15:30");

test.before(async () => {
  await writeActivities(start, end, await dir);
});

test(`Generating lms-activity-rooms.courses.csv ${start} - ${end}`, async (t) => {
  const fileName = path.resolve(await dir, "lms-activity-rooms.courses.csv");
  const content = fs.readFileSync(fileName, { encoding: "utf-8" });
  t.snapshot(content);
});
test(`Generating lms-activity-rooms.sections.csv ${start} - ${end}`, async (t) => {
  const fileName = path.resolve(await dir, "lms-activity-rooms.sections.csv");
  const content = fs.readFileSync(fileName, { encoding: "utf-8" });
  t.snapshot(content);
});
test(`Generating lms-activity-rooms.examiners.csv ${start} - ${end}`, async (t) => {
  const fileName = path.resolve(await dir, "lms-activity-rooms.examiners.csv");
  const content = fs.readFileSync(fileName, { encoding: "utf-8" });
  t.snapshot(content);
});
test(`lms-activity-rooms.students.csv is not empty`, async (t) => {
  const fileName = path.resolve(await dir, "lms-activity-rooms.students.csv");
  const content = fs.readFileSync(fileName, { encoding: "utf-8" });
  // Just confirm that this isn't empty. Could contain sensitive information about students.
  t.assert(content.length);
});
