import { Router } from 'express'
import user from './user'

export default ({ config, db }) => {
  let v1 = Router()

  // mount the user resource
  v1.use('/user', user({ config, db }))

  return v1
}
