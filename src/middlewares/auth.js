import { Router } from 'express'
import jwt from 'express-jwt'
import config from '../config'

const parseAuthorization = (req, res, next) => {
  if (req['headers']['authorization']) {
    req.jwtToken = req['headers']['authorization'].substr(7)
  }
  next()
}

export default () => {
  let routes = Router()

  // JWT Validation
  routes.all('/v1/*', jwt({secret: config.jwtSecret}))

  // Parting Authorization header
  routes.use(parseAuthorization)

  return routes
}
