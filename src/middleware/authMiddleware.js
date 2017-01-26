import { Router } from 'express'
import jwt from 'express-jwt'
import config from '../config.js'

export default ({ auth, db }) => {
  let routes = Router()

  // auth0 protection
  routes.use(jwt({secret: config.jwtSecret}))

  // req middleware
  const reqs = (req, res, next) => {
    if (req['headers']['authorization']) {
      req.jwtToken = req['headers']['authorization'].substr(7)
    }
    next()
  }

  routes.use(reqs)

  // error middleware
  const errors = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send({
        message: err.message
      })
    }
    next()
  }

  routes.use(errors)

  return routes
}
