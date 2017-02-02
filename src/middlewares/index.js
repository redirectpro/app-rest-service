import { Router } from 'express'
import auth from './auth'

export default ({ conn }) => {
  let routes = Router()

  // add middleware here
  routes.use(auth({ conn }))

  return routes
}
