import LoggerHandler from '../../handlers/logger.handler'
import ErrorHandler from '../../handlers/error.handler'
import ApplicationService from '../../services/application.service'

const error = new ErrorHandler()
const logger = new LoggerHandler()
const applicationService = new ApplicationService()

exports.getPlans = (req, res) => {
  const path = req.originalUrl
  const responseHandler = (res, plans) => {
    return res.status(200).send(plans)
  }

  applicationService.billing.getPlans().then((plans) => {
    logger.info(`${path} result of applicationService.billing.getPlans then`)
    return responseHandler(res, plans)
  }).catch((err) => {
    logger.warn(`${path} result of applicationService.billing.getPlans catch`)
    return error.response(err, req, res)
  })
}

exports.getProfile = (req, res) => {
  const responseHandler = (res, application) => {
    return res.status(200).send({
      email: application.billingEmail,
      card: application.card,
      subscription: application.subscription
    })
  }

  return responseHandler(res, req.application)
}

exports.putCreditCard = (req, res) => {
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
    return error.response(err, req, res)
  })
}

exports.putPlan = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId
  const newPlanId = req.params.planId
  const responseHandler = (res, subscription) => {
    let result = applicationService.billing.subscriptionResponseHandler(subscription)
    return res.status(200).send(result)
  }

  const application = req.application
  const plans = req.applicationPlans

  logger.info(`${path} result of applicationService.get/applicationService.billing.getPlans then`)
  const currentPlanId = application.subscription.plan.id
  let err

  if (!application.card || (application.card && !application.card.last4)) {
    err = {
      name: 'CreditCardNotFound',
      message: 'Please add a card to your account before choosing a plan.'
    }
  }

  if (currentPlanId === newPlanId) {
    err = {
      name: 'SamePlan',
      message: 'The selected plan is the same as the current plan.'
    }
  }

  if (err) {
    return error.response(err, req, res)
  }

  const currentPlan = plans.find(item => item.id === currentPlanId)
  const newPlan = plans.find(item => item.id === newPlanId)

  if (newPlan.price < currentPlan.price) {
    /*
     * DELETE subscription - It's for DOWNGRADE
     * at the end of the plan, an event will be emitted and then
     * a new plan will be set.
     */
    return applicationService.billing.deleteSubscription({
      id: application.subscription.id,
      applicationId: applicationId,
      at_period_end: true,
      upcomingPlanId: newPlanId
    }).then((subscription) => {
      logger.info(`${path} result of applicationService.billing.deleteSubscription then`)
      return responseHandler(res, subscription)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.billing.deleteSubscription catch`, err.name)
      return error.response(err, req, res)
    })
  } else {
    /* UPDATE subscription - It's for UPGRADE */
    return applicationService.billing.updateSubscription({
      id: application.subscription.id,
      applicationId: applicationId,
      planId: newPlanId
    }).then((subscription) => {
      logger.info(`${path} result of applicationService.billing.updateSubscription then`)
      return responseHandler(res, subscription)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.billing.updateSubscription catch`, err.name)
      return error.response(err, req, res)
    })
  }
}

exports.getPlanUpcoming = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId
  const newPlanId = req.params.planId
  const upcoming = {}
  const responseHandler = (res, upcoming) => {
    return res.status(200).send({
      at_period_end: upcoming.at_period_end,
      plan: {
        id: upcoming.plan.id,
        price: upcoming.plan.price,
        upcomingCost: upcoming.plan.upcomingCost
      }
    })
  }

  const application = req.application
  const plans = req.applicationPlans
  const currentPlanId = application.subscription.plan.id

  if (newPlanId === currentPlanId) {
    let err = {
      name: 'SamePlan',
      message: 'The selected plan is the same as the current plan.'
    }
    return error.response(err, req, res)
  }

  const currentPlan = plans.find(item => item.id === currentPlanId)
  const newPlan = plans.find(item => item.id === newPlanId)

  upcoming.plan = {
    id: newPlan.id,
    price: newPlan.price
  }

  if (newPlan.price < currentPlan.price) {
    upcoming.at_period_end = true
    upcoming.plan.upcomingCost = 0
    return responseHandler(res, upcoming)
  } else {
    upcoming.at_period_end = false
    return applicationService.billing.upcomingSubscriptionCost({
      applicationId: applicationId,
      planId: newPlanId
    }).then((cost) => {
      logger.info(`${path} result of applicationService.billing.upcomingSubscriptionCost then`)
      upcoming.plan.upcomingCost = cost
      return responseHandler(res, upcoming)
    }).catch((err) => {
      logger.warn(`${path} result of promise chain catch`, err.name)
      return error.response(err, req, res)
    })
  }
}

exports.postCancelUpcomingPlan = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId
  const application = req.application
  const planId = application.subscription.plan.id

  const responseHandler = (res, subscription) => {
    return res.status(200).send({
      plan: {
        upcomingPlanId: subscription.plan.upcomingPlanId
      }
    })
  }

  if (application.subscription.plan.upcomingPlanId === null) {
    let err = {
      name: 'NoUpcomingPlan',
      message: 'There is no upcoming plan setted.'
    }
    return error.response(err, req, res)
  }

  return applicationService.billing.updateSubscription({
    id: application.subscription.id,
    applicationId: applicationId,
    planId: planId
  }).then((subscription) => {
    logger.info(`${path} result of applicationService.billing.updateSubscription then`)
    return responseHandler(res, subscription)
  }).catch((err) => {
    logger.warn(`${path} result of applicationService.billing.updateSubscription catch`, err.name)
    return error.response(err, req, res)
  })
}
