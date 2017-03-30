import express from 'express'
import StripeService from '../../services/stripe.service'
import ErrorHandler from '../../handlers/error.handler'

export default () => {
  const router = express.Router()
  const stripeService = new StripeService()

  const myMiddleware = (req, res, next) => {
    if (!req.body || req.body.object !== 'event' || !req.body.id) {
      let err = ErrorHandler.typeError('InvalidNotFound', 'Invalid event')
      return next(err)
    }

    stripeService.retrieveEvent(req.body.id).then((event) => {
      req.stripeEvent = event
      return next()
    }).catch((err) => {
      return next(err)
    })
  }

  /*
   * https://stripe.com/docs/subscriptions/canceling-pausing
   * - fazer upcoming plan, downgrade nunca podera ser feito
   * em caso de sobrar credito. Implementar tratamento de evento quando
   * for cancelado para trocar plano.
   */
  router.post('/', myMiddleware, (req, res) => {
    console.log(req.stripeEvent)
    res.status(200).send()
  })

  return router
}
