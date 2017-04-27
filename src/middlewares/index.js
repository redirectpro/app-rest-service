import { Router } from 'express'
import auth from './auth'
import validator from './validator'

export default () => {
  let routes = Router()

  // add middleware here
  routes.use(auth())

  routes.use(validator())

  return routes
}
