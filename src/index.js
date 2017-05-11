import express from 'express'
import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import {version, commit} from '../package.json'
import middlewares from './middlewares'
import routes from './routes'
import config from './config'
import ErrorHandler from './handlers/error.handler'

class App {

  constructor () {
    this.app = express()
  }

  prepar () {
    // 3rd party middleware
    this.app.use(cors({
      exposedHeaders: config.corsHeaders
    }))

    this.app.use(bodyParser.json({
      limit: config.bodyLimit,
      extended: true
    }))

    // internal middleware
    this.app.use(middlewares())

    // version/commit
    this.app.get('/', (req, res) => {
      res.json({
        'version': version,
        'commit': commit
      })
    })

    // api routers
    this.app.use(routes())

    // Formata error genericos
    const error = new ErrorHandler()
    this.app.use(error.response)
  }

  startListen () {
    this.app.server = http.createServer(this.app)
    this.app.server.listen(config.port)
    console.log(`Started on port ${this.app.server.address().port}`)
  }

  stopListen () {
    this.app.server.close()
  }

  initialize () {
    this.prepar()
    this.startListen()
  }

  returnApp () {
    return this.app
  }
}

if (!module.parent) {
  const app = new App()
  app.initialize()
}

export default App
