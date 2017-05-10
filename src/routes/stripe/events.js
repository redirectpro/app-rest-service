import Router from 'express'
import eventsCallback from './events.callback'

export default () => {
  let router = Router()

  router.post('/events', eventsCallback.validateStripeEvent, eventsCallback.postEvent)

  return router
}
