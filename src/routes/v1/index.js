import Router from 'express'
import user from './user'
import billing from './billing'
import redirect from './redirect'

export default () => {
  let router = Router()

  router.use(user())
  router.use(billing())
  router.use(redirect())

  return router
}
