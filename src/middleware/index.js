import { Router } from 'express'
import authMiddleware from './authMiddleware'

export default ({ auth, db }) => {
  let routes = Router()

  // add middleware here
  routes.use(authMiddleware({auth, db}))

  return routes
}
