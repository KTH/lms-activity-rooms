
/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
const log = require('skog')
const CanvasApi = require('@kth/canvas-api')
const csv = require('fast-csv')
const tempy = require('tempy')
const fs = require('fs')
const Joi = require('@hapi/joi')

const ANTAGNA_ID = 25

const canvasApi = CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
)


/**
 * Send a set of files compressed as a single zip file to Canvas as SIS Import.
 *
 * Returns a Promise that is resolved only when the SIS Import is finished
 */
async function sendFiles (files) {
  return

  // WIP
  // WIP
  // WIP

  const file = tempy.file({ name: 'enrollments.csv' })
  log.debug(`SIS IMPORT: Created tmp file [${file}]`)

  await writeEnrollments(enrollments, file)
  log.debug(`SIS IMPORT: File [${file}] ready to be sent to Canvas`)

  const { body: response } = await canvasApi.sendSis(
    '/accounts/1/sis_imports',
    file
  )
  const url = `${process.env.CANVAS_API_URL}/accounts/1/sis_imports/${
    response.id
  }`
  log.info(
    `SIS IMPORT: correctly created with ID [${response.id}]. Details: ${url}`
  )

  let progress = 0
  let sisImport = null

  while (progress < 100) {
    sisImport = (await canvasApi.get(`/accounts/1/sis_imports/${response.id}`))
      .body
    progress = sisImport.progress
    log.trace(
      `SIS IMPORT [${response.id}] status "${
        sisImport.workflow_state
      }". Progress: ${progress}`
    )
  }

  if (sisImport.workflow_state !== 'imported') {
    log.error(`SIS IMPORT ERROR. Please check import with ID ${response.id}`)
  } else {
    log.info(`SIS IMPORT CORRECTLY FINISHED. Details: ${url}`)
  }
}
