// const path = require('path')
// const express = require('express')

// const app = express()
// const port = require('./port')

// app.use(express.static(path.join(__dirname, 'dist/spa-mat')))

// app.listen(port, () => {
//   console.log('music run in port' + port)
//   console.log('If port(' + port + ') is used pls fix it in port.js')
// })

// app.get('/', (req, res, next) => {
//   res.sendFile('/index.html')
// })
const express = require('express')
const serveStatic = require('serve-static')
const history = require('connect-history-api-fallback')
const path = require('path')
const port = require('./port')
const compression = require('compression')

const app = express()

app.use(compression());
app.use(history())
app.use(express.static(path.join(__dirname, 'dist/spa-mat')))
app.listen(port, () => {
  console.log('music run in port' + port)
  console.log('If port(' + port + ') is used pls fix it in port.js')
})
