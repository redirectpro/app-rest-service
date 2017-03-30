import Router from 'express'
import v1 from './v1'
import stripe from './stripe'

export default () => {
  let router = Router()

  router.use('/v1', v1())
  router.use('/stripe', stripe())

  return router
}
