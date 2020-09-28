/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
const log = require('skog')
const CanvasApi = require('@kth/canvas-api')
const fs = require('fs').promises
const { createWriteStream } = require('fs')
const path = require('path')
const JSZip = require('jszip')
const tempy = require('tempy')

const canvasApi = CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
)

async function test () {
  try {
    await canvasApi.get('/accounts/1')
    return true
  } catch (err) {
    log.error(err, 'Error when trying to get /accounts/1')
    return false
  }
}

/**
 * Send a set of files compressed as a single zip file to Canvas as SIS Import.
 *
 * Returns a Promise that is resolved only when the SIS Import is finished
 */
async function sendDirectory (dir) {
  const zip = new JSZip()
  const zipFile = tempy.file({ extension: 'zip' })
  const files = await fs.readdir(dir)

  for (const file of files) {
    zip.file(file, await fs.readFile(path.resolve(dir, file)))
  }

  await new Promise(accept => {
    zip
      .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
      .pipe(createWriteStream(zipFile))
      .on('finish', function () {
        log.info(`Finished generating zip file "${zipFile}"`)
        accept()
      })
      .on('error', function (err) {
        log.fatal(err, 'Error generating the ZIP file')
        process.exit(1)
      })
  })

  log.debug(`SIS IMPORT: File [${zipFile}] ready to be sent to Canvas`)

  const { body: response } = await canvasApi.sendSis(
    '/accounts/1/sis_imports',
    zipFile
  )
  const url = `${process.env.CANVAS_API_URL}/accounts/1/sis_imports/${response.id}`
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
      `SIS IMPORT [${response.id}] status "${sisImport.workflow_state}". Progress: ${progress}`
    )
  }

  if (sisImport.workflow_state !== 'imported') {
    log.error(`SIS IMPORT ERROR. Please check ${url}`)
  } else {
    log.info(`SIS IMPORT CORRECTLY FINISHED. Details: ${url}`)
  }
}

module.exports = {
  sendDirectory,
  test
}
