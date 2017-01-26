import { Router } from 'express'
import user from './user'

export default ({ auth, db }) => {
  let v1 = Router()

  // mount the user resource
  v1.use('/user', user({ auth, db }))

  return v1
}
