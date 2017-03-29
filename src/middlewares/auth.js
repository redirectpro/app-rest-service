import { Router } from 'express'
import jwt from 'express-jwt'
import config from '../config'

const parseAuthorization = (req, res, next) => {
  if (req['headers']['authorization']) {
    req.jwtToken = req['headers']['authorization'].substr(7)
  }
  next()
}

const parseUserId = (req, res, next) => {
  // object key will be _id to identify that is not from JWT
  if (req['user'] && req['user']['sub'] && req['user']['sub']) {
    req.user._id = req['user']['sub']
    if (req.user._id.indexOf('|') >= 0) {
      req.user._id = req.user._id.split('|')[1]
    }
  }
  next()
}

export default () => {
  let routes = Router()

  // JWT Validation
  routes.all('/v1/*', jwt({secret: config.jwtSecret}))

  // Parting Authorization header
  routes.use(parseAuthorization)

  // Parting JWT UserID
  routes.use(parseUserId)

  return routes
}
