import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import {version, commit} from '../package.json'
import middlewares from './middlewares'
import conn from './connections'
import v1 from './v1'
import config from './config.js'
import errorHandler from './handlers/errorHandler'

const app = express()
app.server = http.createServer(app)

// 3rd party middleware
app.use(cors({
  exposedHeaders: config.corsHeaders
}))

app.use(bodyParser.json({
  limit: config.bodyLimit,
  extended: true
}))

// internal middleware
app.use(middlewares())

// version/commit
app.get('/', (req, res) => {
  res.json({
    'version': version,
    'commit': commit
  })
})

// api v1 router
app.use('/v1', v1({ conn }))

app.use(errorHandler)

app.server.listen(config.port)

console.log(`Started on port ${app.server.address().port}`)

export default app
