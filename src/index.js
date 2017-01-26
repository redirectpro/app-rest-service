import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import initializeDb from './db'
import middlewares from './middlewares'
import v1 from './v1'
import config from './config.js'
import {version, commit} from '../package.json'
import * as auth0 from 'auth0'
import stripe from 'stripe'
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

// auth0
config.authClient = new auth0.AuthenticationClient({
  domain: config.auth0Domain
})

config.authManage = new auth0.ManagementClient({
  domain: config.auth0Domain,
  token: config.auth0Token
})

// stripe
config.stripe = stripe(config.stripeSecretKey)

// connect to db
initializeDb(db => {
  // internal middleware
  app.use(middlewares({config, db}))

  // version/commit
  app.get('/', (req, res) => {
    res.json({
      'version': version,
      'commit': commit
    })
  })

  // api v1 router
  app.use('/v1', v1({config, db}))

  app.use(errorHandler)

  app.server.listen(config.port)

  console.log(`Started on port ${app.server.address().port}`)
})

export default app
