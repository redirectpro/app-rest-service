import { Router } from 'express'
import user from './user'
import billing from './billing'

export default () => {
  let v1 = Router()

  v1.use('/user', user())
  // v1.use('/billing', billing())

  return v1
}
