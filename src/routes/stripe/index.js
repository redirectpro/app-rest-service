import Router from 'express'
import events from './events'

export default () => {
  let router = Router()

  router.use(events())

  return router
}
