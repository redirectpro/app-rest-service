import { Router } from 'express'
import user from './user'

export default ({ conn }) => {
  let v1 = Router()

  // mount the user resource
  v1.use('/user', user({ conn }))

  return v1
}
