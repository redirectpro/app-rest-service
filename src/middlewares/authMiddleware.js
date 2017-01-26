import { Router } from 'express'
import jwt from 'express-jwt'

export default ({ config, db }) => {
  let routes = Router()

  // auth0 protection
  routes.use(jwt({secret: config.jwtSecret}))

  // req middleware
  // Parting Authorization header
  const reqs = (req, res, next) => {
    if (req['headers']['authorization']) {
      req.jwtToken = req['headers']['authorization'].substr(7)
    }
    next()
  }

  routes.use(reqs)

  return routes
}
