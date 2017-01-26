import { Router } from 'express'
import authMiddleware from './authMiddleware'

export default ({ config, db }) => {
  let routes = Router()

  // add middleware here
  routes.use(authMiddleware({config, db}))

  return routes
}
