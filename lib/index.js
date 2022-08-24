const log = require("skog");
const got = require("got");
const path = require("path");
const fs = require("fs");
const csv = require("fast-csv");
const os = require("os");
const { sendDirectory } = require("./canvas");

const EXAMINER_ROLE_ID = 10;
const STUDENT_ROLE_ID = 3;
const TIMEOUT = 1000 * 60 * 15; // 15 minutes should be enough
const NUMBER_OF_RETRIES = 5;
const DELAY = 1000 * 60 * 5;

/** Get the "Kontrolskrivning" activities of a day from AKT_API */
async function getActivities(date) {
  try {
    const { body } = await got(
      `${process.env.AKTIVITETSTILLFALLEN_API_URL}/aktivitetstillfallen/students?fromDate=${date}&toDate=${date}`,
      {
        timeout: TIMEOUT,
        responseType: "json",
        retry: {
          calculateDelay: ({ attemptCount, error }) => {
            // This function replaces the default function + limit param. The reason is mainly to
            // log each time a retry is performed
            log.info(
              `An error occurred when trying to reach the akt api: ${error}. Retrying with attempt: ${attemptCount}/${NUMBER_OF_RETRIES}`
            );
            if (attemptCount >= NUMBER_OF_RETRIES) {
              return 0; // no more retries
            }
            return DELAY;
          },
        },
        headers: {
          canvas_api_token: process.env.AKTIVITETSTILLFALLEN_API_TOKEN,
        },
      }
    );

    const result = body.aktivitetstillfallen.map((akt) => {
      const registrationEndDate =
        akt.anmalningsperiod && akt.anmalningsperiod.endDate;
      const name = akt.benamning.sv;

      return {
        ...akt,
        registrationEndDate,
        name,
      };
    });

    log.info(`Date ${date}. Obtained ${result.length} activities`);

    return result;
  } catch (err) {
    log.error(err, `Error calling aktivitetstillfalle api for date ${date}`);
    return [];
  }
}

async function writeCoursesAndSections(activities, coursesFile, sectionsFile) {
  const normalizedExamRooms = [];

  for (const activity of activities) {
    // Example: "AA1111/AA1112 TEN1 & AA1111 TEN2"
    const codes = activity.aktiviteter
      .map((akt) => `${akt.courseCodes.join("/")} ${akt.activityCode}`)
      .join(" & ");

    const schools = Array.from(
      new Set(activity.aktiviteter.map((akt) => akt.courseOwner))
    );

    if (schools.length > 1) {
      log.info(
        `The activity "${codes}: ${activity.date}" [AKT.${activity.ladokUID}] has more than one school: ${schools}. It is going to be created in the first one (${schools[0]})`
      );
    }

    normalizedExamRooms.push({
      ladok_uid: activity.ladokUID,
      school: schools[0],
      name: `${codes} [${activity.date}] ${activity.name}`,
      codes,
      date: activity.date,
    });
  }

  const writer1 = fs.createWriteStream(coursesFile);
  const stream1 = csv.format({ headers: true });
  stream1.pipe(writer1);
  normalizedExamRooms.forEach((a) => {
    // TODO: When templates are introduced, this code should be activated:
    // const endDate = new Date(a.date)
    // endDate.setDate(endDate.getDate() + 60)
    // const dateString = endDate.toISOString().split('T')[0]

    stream1.write({
      course_id: `AKT.${a.ladok_uid}`,
      short_name: a.name,
      long_name: a.name,
      account_id: `${a.school} - Examinations`,
      status: "active",
      blueprint_course_id: "exam_bp_2020_p0",
      // end_date: dateString
    });
  });
  stream1.end();

  await new Promise((resolve, reject) => {
    writer1.on("error", reject);
    writer1.on("finish", resolve);
  });

  log.info(`Finished writing file ${coursesFile}`);

  const writer2 = fs.createWriteStream(sectionsFile);
  const stream2 = csv.format({ headers: true });
  stream2.pipe(writer2);
  normalizedExamRooms.forEach((a) => {
    // Section for non-funka
    stream2.write({
      course_id: `AKT.${a.ladok_uid}`,
      section_id: `AKT.${a.ladok_uid}`,
      name: `${a.codes} - Section 1`,
      status: "active",
    });

    // Section for funka
    stream2.write({
      course_id: `AKT.${a.ladok_uid}`,
      section_id: `AKT.${a.ladok_uid}.FUNKA`,
      name: `${a.codes} - Section 2`, // <---- TODO: Change format?
      status: "active",
    });
  });
  stream2.end();

  await new Promise((resolve, reject) => {
    writer2.on("error", reject);
    writer2.on("finish", resolve);
  });

  log.info(`Finished writing file ${sectionsFile}`);
}

async function writeExaminers(activities, file) {
  const normalizedExaminers = [];

  for (const activity of activities) {
    const examiners = [];

    for (const akt of activity.aktiviteter) {
      for (const examiner of akt.courseExaminers) {
        examiners.push(examiner);
      }
    }

    log.info(
      `Activity ${activity.ladokUID}. Added ${examiners.length} examiners`
    );

    for (const examiner of examiners) {
      normalizedExaminers.push({
        activity_ladok_uid: activity.ladokUID,
        examiner_user_id: examiner.kthid,
        date: activity.date,
      });
    }
  }

  const writer = fs.createWriteStream(file);
  const stream = csv.format({ headers: true });
  stream.pipe(writer);
  normalizedExaminers.forEach((a) => {
    stream.write({
      section_id: `AKT.${a.activity_ladok_uid}`,
      user_id: a.examiner_user_id,
      role_id: EXAMINER_ROLE_ID,
      status: "active",
    });

    stream.write({
      section_id: `AKT.${a.activity_ladok_uid}.FUNKA`,
      user_id: a.examiner_user_id,
      role_id: EXAMINER_ROLE_ID,
      status: "active",
    });
  });
  stream.end();

  await new Promise((resolve, reject) => {
    writer.on("error", reject);
    writer.on("finish", resolve);
  });

  log.info(`Finished writing file ${file}`);
}

async function getStudents(activities) {
  const result = [];

  for (const activity of activities) {
    if (!activity.registrationEndDate) {
      log.info("This activity has no registration period, skipping it.");
      // eslint-disable-next-line no-continue
      continue;
    }

    if (new Date(`${activity.registrationEndDate}T23:59:59Z`) >= new Date()) {
      log.info(
        `Activity ${activity.ladokUID}. Registration not closed. It closes on ${activity.registrationEndDate}`
      );
      // eslint-disable-next-line no-continue
      continue;
    }

    const students = [];
    activity.aktiviteter.forEach((akt) =>
      students.push(...akt.registeredStudents)
    );

    log.info(
      `Activity ${activity.ladokUID}. Added ${students.length} students`
    );

    for (const student of students) {
      result.push({
        student_user_id: student.kthid,
        section_id:
          student.funka.length > 0
            ? `AKT.${activity.ladokUID}.FUNKA`
            : `AKT.${activity.ladokUID}`,
      });
    }
  }
  return result;
}

async function writeStudents(activities, file) {
  const students = await getStudents(activities);

  const writer = fs.createWriteStream(file);
  const stream = csv.format({ headers: true });
  stream.pipe(writer);
  students.forEach((a) =>
    stream.write({
      section_id: a.section_id,
      user_id: a.student_user_id,
      role_id: STUDENT_ROLE_ID,
      status: "active",
      limit_section_privileges: "true",
    })
  );
  stream.end();

  await new Promise((resolve, reject) => {
    writer.on("error", reject);
    writer.on("finish", resolve);
  });

  log.info(`Finished writing file ${file}`);
}

/**
 * Writes activities data into a set of files (courses, sections, examiners
 * and students)
 */
async function writeActivities(start, end, dir) {
  const activities = [];
  for (
    // Make sure that "date" is a copy of "start". Otherwise, the "start"
    // variable mutates!!
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const dateString = date.toISOString().split("T")[0];
    // eslint-disable-next-line no-await-in-loop
    activities.push(...(await getActivities(dateString)));
  }
  log.info(`Total number of activities: ${activities.length}`);

  await writeCoursesAndSections(
    activities,
    path.resolve(dir, "lms-activity-rooms.courses.csv"),
    path.resolve(dir, "lms-activity-rooms.sections.csv")
  );
  await writeExaminers(
    activities,
    path.resolve(dir, "lms-activity-rooms.examiners.csv")
  );
  await writeStudents(
    activities,
    path.resolve(dir, "lms-activity-rooms.students.csv")
  );
}

/** Sends all activities of a certain period of time to Canvas */
async function syncActivities(start, end) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "exams-"));
  log.info(`Created temporary directory "${dir}`);
  await writeActivities(start, end, dir);
  log.info(`Directory filled with 4 files`);
  await sendDirectory(dir);
}

module.exports = {
  getActivities,
  writeActivities,
  syncActivities,
};
