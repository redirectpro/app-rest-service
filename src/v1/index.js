import Router from 'express'
import user from './user'
import billing from './billing'

export default () => {
  let router = Router()

  router.use('/user', user())
  router.use('/billing', billing())

  return router
}
