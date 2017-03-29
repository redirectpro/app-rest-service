import { Router } from 'express'
import auth from './auth'
import params from './params'

export default () => {
  let routes = Router()

  // add middleware here
  routes.use(auth())
  routes.use(params())

  return routes
}
