import express from 'express'
import LoggerHandler from '../../handlers/logger.handler'
import ErrorHandler from '../../handlers/error.handler'
import ApplicationService from '../../services/application.service'

export default () => {
  const router = express.Router()
  const logger = LoggerHandler
  const applicationService = new ApplicationService()

  router.get('/plans', (req, res) => {
    const path = req.originalUrl
    const responseHandler = (res, plans) => {
      return res.status(200).send(plans)
    }

    applicationService.billing.getPlans().then((plans) => {
      logger.info(`${path} result of applicationService.billing.getPlans then`)
      return responseHandler(res, plans)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.billing.getPlans catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.get('/:applicationId/profile', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const responseHandler = (res, application) => {
      return res.status(200).send({
        email: application.billingEmail,
        card: application.card,
        subscription: application.subscription
      })
    }

    applicationService.get(applicationId).then((application) => {
      logger.info(`${path} result of applicationService.get then`)
      return responseHandler(res, application)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.get catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.put('/:applicationId/creditCard/:token', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const token = req.params.token
    const responseHandler = (res, card) => {
      return res.status(200).send({
        last4: card.last4,
        brand: card.brand,
        exp_month: card.exp_month,
        exp_year: card.exp_year
      })
    }

    applicationService.billing.updateCreditCard({
      applicationId: applicationId,
      token: token
    }).then((card) => {
      logger.info(`${path} result of applicationService.billing.updateCreditCard then`)
      return responseHandler(res, card)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.billing.updateCreditCard catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.put('/:applicationId/plan/:planId', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const planId = req.params.planId
    const responseHandler = (res, subscription) => {
      return res.status(200).send({
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        trial_start: subscription.trial_start,
        trial_end: subscription.trial_end,
        plan: {
          id: subscription.plan.id,
          interval: subscription.plan.interval,
          upcoming: subscription.plan.upcoming
        }
      })
    }

    applicationService.get(applicationId).then((application) => {
      logger.info(`${path} result of applicationService.get then`)
      let error

      if (!application.card || (application.card && !application.card.last4)) {
        error = {
          name: 'CreditCardNotFound',
          message: 'Please add a card to your account before choosing a plan.'
        }
      }

      if (application.subscription.plan && application.subscription.plan.id &&
        application.subscription.plan.id === planId) {
        error = {
          name: 'SamePlan',
          message: 'The selected plan is the same as the current plan.'
        }
      }

      if (error) {
        return ErrorHandler.responseError(error, req, res)
      }

      applicationService.billing.updateSubscription({
        applicationId: applicationId,
        planId: planId
      }).then((subscription) => {
        logger.info(`${path} result of applicationService.billing.updateSubscription then`)
        return responseHandler(res, subscription)
      }).catch((err) => {
        logger.warn(`${path} result of applicationService.billing.updateSubscription catch`, err.name)
        return ErrorHandler.responseError(err, req, res)
      })
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.get catch`, err.name)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.get('/:applicationId/plan/:planId/upcomingCost', (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const planId = req.params.planId
    const responseHandler = (res, cost) => {
      return res.status(200).send({
        cost: cost
      })
    }

    applicationService.billing.upcomingSubscriptionCost({
      applicationId: applicationId,
      planId: planId
    }).then((cost) => {
      logger.info(`${path} result of this.applicationService.billing.upcomingSubscriptionCost then`)
      return responseHandler(res, cost)
    }).catch((err) => {
      logger.warn(`${path} result of this.applicationService.billing.upcomingSubscriptionCost catch`, err.name)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  return router
}
