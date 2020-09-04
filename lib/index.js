const log = require('skog')
const got = require('got')
const path = require('path')
const fs = require('fs')
const csv = require('fast-csv')
const tempy = require('tempy')
const { sendDirectory } = require('./canvas')
const memoizee = require('memoizee')

const BLUEPRINT_SIS_ID = process.env.BLUEPRINT_SIS_ID
const EXAMINER_ROLE_ID = 10
const STUDENT_ROLE_ID = 3

/** Get examinators from Kopps */
async function getExaminers (courseCode) {
  try {
    const { body } = await got(
      `${process.env.KOPPS_API_URL}/course/${courseCode}/detailedinformation`,
      {
        responseType: 'json'
      }
    )

    return body.examiners
  } catch (err) {
    log.error(err, `Error calling kopps api for course code ${courseCode}`)
    return []
  }
}

/** Get the "Kontrolskrivning" activities of a day from AKT_API */
async function getActivities (date) {
  try {
    const { body } = await got(
      `${process.env.AKTIVITETSTILLFALLEN_API_URL}/aktivitetstillfallen/students?fromDate=${date}&toDate=${date}`,
      {
        responseType: 'json',
        headers: {
          canvas_api_token: process.env.AKTIVITETSTILLFALLEN_API_TOKEN
        }
      }
    )

    const result = body.aktivitetstillfallen
      .map((akt, i) => {
        const raw = body.aktivitetstillfallenraw[i]
        const registrationPeriod = raw.aktivitetstillfalle.Anmalningsperiod
        const activityType = raw.type.ID

        return {
          ...akt,
          registrationPeriod,
          activityType
        }
      })
      .filter(akt => akt.activityType === '135201')

    log.info(
      `Date ${date}. Obtained ${result.length} KS out of ${body.aktivitetstillfallen.length} activities`
    )

    return result
  } catch (err) {
    log.error(err, `Error calling aktivitetstillfalle api for date ${date}`)
    return []
  }
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
      ladok_uid: activity.ladokUID,
      school: schools[0],
      name: `${titles}: ${activity.date}`
    })
  }

  const writer1 = fs.createWriteStream(coursesFile)
  const stream1 = csv.format({ headers: true })
  stream1.pipe(writer1)
  normalized.forEach(a =>
    stream1.write({
      course_id: `AKT.${a.ladok_uid}`,
      short_name: a.name,
      long_name: a.name,
      account_id: `${a.school} - Examinations`,
      status: 'active',
      blueprint_course_id: BLUEPRINT_SIS_ID
    })
  )
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
      course_id: `AKT.${a.ladok_uid}`,
      section_id: `AKT.${a.ladok_uid}`,
      name: `${a.name} - Section 1`,
      status: 'active',
      integration_id: a.ladok_uid
    })

    // Section for funka
    stream2.write({
      course_id: `AKT.${a.ladok_uid}`,
      section_id: `AKT.${a.ladok_uid}.FUNKA`,
      name: `${a.name} - Section 2`,
      status: 'active',
      integration_id: `${a.ladok_uid}_FUNKA`
    })
  })
  stream2.end()

  await new Promise((resolve, reject) => {
    writer2.on('error', reject)
    writer2.on('finish', resolve)
  })

  log.info(`Finished writing file ${sectionsFile}`)
}

async function writeExaminers (activities, file) {
  const getExaminersMemo = memoizee(getExaminers)

  const normalized = []

  for (const activity of activities) {
    const courseCodes = []
    activity.aktiviteter.forEach(akt => courseCodes.push(...akt.courseCodes))

    const examiners = []
    for (const courseCode of courseCodes) {
      examiners.push(...(await getExaminersMemo(courseCode)))
    }

    log.info(
      `Activity ${activity.ladokUID}. Added ${examiners.length} examiners`
    )

    for (const examiner of examiners) {
      normalized.push({
        ladok_uid: activity.ladokUID,
        user_id: examiner.kthid
      })
    }
  }

  const writer = fs.createWriteStream(file)
  const stream = csv.format({ headers: true })
  stream.pipe(writer)
  normalized.forEach(a => {
    stream.write({
      section_id: `AKT.${a.ladok_uid}`,
      user_id: a.user_id,
      role_id: EXAMINER_ROLE_ID,
      status: 'active'
    })

    stream.write({
      section_id: `AKT.${a.ladok_uid}.FUNKA`,
      user_id: a.user_id,
      role_id: EXAMINER_ROLE_ID,
      status: 'active'
    })
  })
  stream.end()

  await new Promise((resolve, reject) => {
    writer.on('error', reject)
    writer.on('finish', resolve)
  })

  log.info(`Finished writing file ${file}`)
}

async function writeStudents (activities, file) {
  const normalized = []

  for (const activity of activities) {
    if (
      new Date(`${activity.registrationPeriod.Slutdatum}T23:59:59Z`) >=
      new Date()
    ) {
      log.info(
        `Activity ${activity.ladokUID}. Registration not closed. It closes on ${activity.registrationPeriod.Slutdatum}`
      )
      continue
    }

    const students = []
    activity.aktiviteter.forEach(akt =>
      students.push(...akt.registeredStudents)
    )

    log.info(`Activity ${activity.ladokUID}. Added ${students.length} students`)

    for (const student of students) {
      normalized.push({
        user_id: student.kthid,
        section_id:
          student.funka.length > 0
            ? `AKT.${activity.ladokUID}.FUNKA`
            : `AKT.${activity.ladokUID}`
      })
    }
  }

  const writer = fs.createWriteStream(file)
  const stream = csv.format({ headers: true })
  stream.pipe(writer)
  normalized.forEach(a =>
    stream.write({
      section_id: a.section_id,
      user_id: a.user_id,
      role_id: STUDENT_ROLE_ID,
      status: 'active'
    })
  )
  stream.end()

  await new Promise((resolve, reject) => {
    writer.on('error', reject)
    writer.on('finish', resolve)
  })

  log.info(`Finished writing file ${file}`)
}

/**
 * Writes activities data into a set of files (courses, sections, examiners
 * and students)
 */
async function writeActivities (start, end, dir) {
  // TODO: either make this call async, or move it to start of the app so we don't block the process
  fs.mkdirSync(dir, { recursive: true })

  // TODO: test that this loop works for strange date ranges
  // e.g. when time changes, etc.
  let activities = []
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    const dateString = date.toISOString().split('T')[0]
    activities = [...activities, ...(await getActivities(dateString))]
  }

  log.info(`Total number of activities: ${activities.length}`)

  await writeCoursesAndSections(
    activities,
    path.resolve(dir, 'courses.csv'),
    path.resolve(dir, 'sections.csv')
  )
  await writeExaminers(activities, path.resolve(dir, 'examiners.csv'))
  await writeStudents(activities, path.resolve(dir, 'students.csv'))
}

/** Sends all activities of a certain period of time to Canvas */
async function syncActivities (start, end) {
  const dir = tempy.directory()
  log.info(`Created temporary directory "${dir}`)
  await writeActivities(start, end, dir)
  log.info(`Directory filled with 4 files`)
  await sendDirectory(dir)

  // TODO: destroy "dir" and its contents
}

module.exports = {
  getActivities,
  writeActivities,
  syncActivities
}
