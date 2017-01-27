import { Router } from 'express'
import auth from './auth'

export default ({ db }) => {
  let routes = Router()

  // add middleware here
  routes.use(auth({ db }))

  return routes
}
