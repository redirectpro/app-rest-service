import StripeService from '../../services/stripe.service'
import ApplicationService from '../../services/application.service'
import LoggerHandler from '../../handlers/logger.handler'
import ErrorHandler from '../../handlers/error.handler'
import config from '../../config'

const logger = LoggerHandler
const stripeService = new StripeService()
const applicationService = new ApplicationService()

exports.validateStripeEvent = (req, res, next) => {
  if (!req.body || req.body.object !== 'event' || !req.body.id) {
    let err = ErrorHandler.typeError('InvalidNotFound', 'Invalid event.')
    return next(err)
  }

  stripeService.retrieveEvent(req.body.id).then((event) => {
    req.stripeEvent = event
    return next()
  }).catch((err) => {
    err.statusCode = 404
    return next(err)
  })
}

exports.postEvent = (req, res) => {
  const path = req.originalUrl

  if (req.stripeEvent.type === 'customer.subscription.deleted') {
    let data = req.stripeEvent.data.object
    let applicationId = data.customer

    applicationService.get(applicationId).then((application) => {
      logger.info(`${path} result of applicationService.get then`)

      /*
       * Subscription MUST BE equal, it means that the current subscription
       * who was deleted is the same in the database and need to be changed
       */
      if (
        application.subscription.id !== data.id &&
        application.subscription.current_period_start >= data.current_period_start
      ) {
        return res.status(200).send({
          message: 'Subscription already processed.'
        })
      }

      let planId = application.subscription.plan.upcomingPlanId || config.defaultPlanId

      return applicationService.billing.createSubscription({
        applicationId: applicationId,
        planId: planId
      })
    }).then((subscription) => {
      logger.info(`${path} result of applicationService.billing.createSubscription then`)
      return res.status(200).send(subscription)
    }).catch((err) => {
      logger.warn(`${path} result of promise chain catch`)
      if (err.name === 'ApplicationNotFound') {
        res.status(200).send(err.message)
      } else {
        res.status(500).send(err)
      }
    })
  } else {
    var message = `Event ${req.stripeEvent.type} has been ignored.`
    logger.info(`${path} result ${message}`)
    return res.status(200).send({ message: message })
  }
}
