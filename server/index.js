const express = require('express')
const app = express()
const prefix = process.env.PROXY_PATH || ''
const cron = require('../cron')
const canvas = require('../lib/canvas')

app.get(prefix + '/_monitor', async (req, res) => {
  const canvasStatus = await canvas.test()

  res.setHeader('Content-Type', 'text/plain')
  res.send([
    `APPLICATION_STATUS: ${canvasStatus ? 'OK' : 'ERROR'}`,
    '',
    `- CANVAS TOKEN: ${canvasStatus ? 'OK' : 'ERROR. Token not valid'}`
  ].join('\n') + '\n')
})

app.get(prefix + '/_monitor_all', async (req, res) => {
  const canvasStatus = await canvas.test()

  res.send(
    [
      '<html><body><pre>',
      `APPLICATION_STATUS: ${canvasStatus ? 'OK' : 'ERROR'}`,
      `- CANVAS TOKEN: ${canvasStatus ? 'OK' : 'ERROR. Token not valid'}`,
      '',
      `- SYNC IS RUNNING NOW: ${cron.isRunning() ? 'YES' : 'NO'}`,
      '',
      'Environment:',
      `- CANVAS_API_URL: ${process.env.CANVAS_API_URL}`,
      `- AKTIVITETSTILLFALLEN_API_URL: ${process.env.AKTIVITETSTILLFALLEN_API_URL}`
    ].join('\n') + '\n'
  )
})

app.get(prefix + '/_about', (req, res) => {
  res.send('Hello antagna')
})

module.exports = app
