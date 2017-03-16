import { Router } from 'express'
import auth from './auth'

export default () => {
  let routes = Router()

  // add middleware here
  routes.use(auth())

  return routes
}
