import { Router } from 'express'
import user from './user'

export default ({ db }) => {
  let v1 = Router()

  // mount the user resource
  v1.use('/user', user({ db }))

  return v1
}
