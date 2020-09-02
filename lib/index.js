const log = require('skog')
const got = require('got')
const path = require('path')
const fs = require('fs')
const csv = require('fast-csv')

const BLUEPRINT_SIS_ID = process.env.BLUEPRINT_SIS_ID

/** Get examinators from Kopps */
async function getExaminators (courseCode) {
  // TODO
}

/** Get the activities of a day from AKT_API */
async function getActivities (date) {
  log.debug(`Date ${date}. Getting activities...`)

  const { body } = await got(
    `${process.env.AKTIVITETSTILLFALLEN_API_URL}/aktivitetstillfallen/students?fromDate=${date}&toDate=${date}`,
    {
      responseType: 'json',
      headers: {
        canvas_api_token: process.env.AKTIVITETSTILLFALLEN_API_TOKEN
      }
    }
  )

  log.info(
    `Date ${date}. Obtained ${body.aktivitetstillfallen.length} activities`
  )

  return body.aktivitetstillfallen
}

async function writeCoursesAndSections (activities, coursesFile, sectionsFile) {
  const normalized = []

  for (const activity of activities) {
    // Example: "AA1111/AA1112 TEN1 & AA1111 TEN2"
    const titles = activity.aktiviteter
      .map(akt => `${akt.courseCodes.join('/')} ${akt.activityCode}`)
      .join(' & ')

    const schools = Array.from(
      new Set(activity.aktiviteter.map(akt => akt.courseOwner))
    )

    if (schools.length > 1) {
      log.error(
        `The activity "${titles}: ${activity.date}" [AKT.${activity.ladokUID}] has more than one school: ${schools}. It is going to be created in the first one (${schools[0]})`
      )
    }

    normalized.push({
      ladokUID: activity.ladokUID,
      school: schools[0],
      name: `${titles}: ${activity.date}`
    })
  }

  const writer1 = fs.createWriteStream(coursesFile)
  const stream1 = csv.format({ headers: true })
  stream1.pipe(writer1)
  normalized.forEach(a => stream1.write({
    course_id: `AKT.${a.ladokUID}`,
    short_name: a.name,
    long_name: a.name,
    account_id: `${a.school} - Examinations`,
    status: 'active',
    blueprint_course_id: BLUEPRINT_SIS_ID
  }))
  stream1.end()

  await new Promise((resolve, reject) => {
    writer1.on('error', reject)
    writer1.on('finish', resolve)
  })

  log.info(`Finished writing file ${coursesFile}`)

  const writer2 = fs.createWriteStream(sectionsFile)
  const stream2 = csv.format({ headers: true })
  stream2.pipe(writer2)
  normalized.forEach(a => {
    // Section for non-funka
    stream2.write({
      course_id: `AKT.${a.ladokUID}`,
      section_id: `AKT.${a.ladokUID}`,
      name: `${a.name} - Section 1`,
      integration_id: a.ladokUID
    })

    // Section for funka
    stream2.write({
      course_id: `AKT.${a.ladokUID}`,
      section_id: `AKT.${a.ladokUID}.FUNKA`,
      name: `${a.name} - Section 2`,
      integration_id: `${a.ladokUID}_FUNKA`
    })
  })
  stream2.end()

  await new Promise((resolve, reject) => {
    writer2.on('error', reject)
    writer2.on('finish', resolve)
  })

  log.info(`Finished writing file ${sectionsFile}`)
}

async function writeExaminers (activities, file) {}

async function writeStudents (activities, file) {}

/**
 * Writes activities data into a set of files (courses, sections, examiners
 * and students)
 */
async function writeActivities (start, end, dir) {
  fs.mkdirSync(dir, { recursive: true })

  // TODO: test that this loop works for strange date ranges
  // e.g. when time changes, etc.
  let activities = []
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toISOString().split('T')[0]
    activities = [...activities, ...(await getActivities(dateString))]
  }

  await writeCoursesAndSections(
    activities,
    path.resolve(dir, 'courses.csv'),
    path.resolve(dir, 'sections.csv')
  )
  await writeExaminers(activities, path.resolve(dir, 'examiners.csv'))
  await writeStudents(activities, path.resolve(dir, 'students.csv'))
}

/**
 * Sends activities data to Canvas
 */
async function sendActivities (activities) {
  // TODO
}

/** Sends all activities of a certain period of time to Canvas */
async function syncActivities (start, end) {}

module.exports = {
  writeActivities,
  sendActivities,
  syncActivities
}
