const express = require('express')
const app = express()
const prefix = process.env.PROXY_PATH || ''
const cron = require('../cron')

app.get(prefix + '/_monitor', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send(
    [
      'APPLICATION_STATUS: OK',
      '- NO MONITOR IMPLEMENTED YET',
      `- Next scheduled synchronization: ${cron.nextSync()}`,
      cron.isRunning() ? '- Sync is running now' : '',
      '',
      'INFO:',
      `- Canvas URL: ${process.env.CANVAS_API_URL}`,
      `- UG URL: ${process.env.UG_URL}`,
      `- Kopps URL: ${process.env.KOPPS_API_URL}`
    ].join('\n')
  )
})

app.get(prefix + '/about', (req, res) => {
  res.send('Hello antagna')
})

module.exports = app
