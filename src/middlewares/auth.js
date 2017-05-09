import { Router } from 'express'
import expressJwt from 'express-jwt'
import config from '../config'
import * as authCallback from './auth.callback'

export default () => {
  let routes = Router()

  // JWT Validation
  routes.all('/v1/*', expressJwt({secret: config.jwtSecret}))

  // Parting Authorization header
  routes.use(authCallback.parseAuthorization)

  // Parting JWT UserID
  routes.use(authCallback.parseUserId)

  return routes
}
