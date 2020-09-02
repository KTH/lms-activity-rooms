const express = require('express')
const app = express()
const prefix = process.env.PROXY_PATH || ''

app.get(prefix + '/_monitor', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('APPLICATION_STATUS: OK')
})

app.get(prefix + '/_about', (req, res) => {
  res.send('Hello antagna')
})

module.exports = app
