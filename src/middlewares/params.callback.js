import LoggerHandler from '../handlers/logger.handler'
import ErrorHandler from '../handlers/error.handler'
import ApplicationService from '../services/application.service'

const logger = LoggerHandler
const applicationService = new ApplicationService()

exports.getApplicationId = (req, res, next) => {
  const userId = req.user._id
  const applicationId = req.params.applicationId
  const path = `getApplicationId userId ${userId} ApplicationId ${applicationId}`

  return applicationService.user.isAuthorized({
    applicationId: applicationId,
    userId: userId
  }).then((authorized) => {
    logger.info(`${path} result of applicationService.user.isAuthorized then`)
    return applicationService.get(applicationId)
  }).then((data) => {
    req.application = data
    return next()
  }).catch((err) => {
    logger.warn(`${path} result of promise chain catch`)
    return next(err)
  })
}

exports.getPlanId = (req, res, next) => {
  const planId = req.params.planId
  applicationService.billing.getPlans().then((plans) => {
    req.plan = plans.find(item => item.id === planId)
    req.applicationPlans = plans

    if (!req.plan) {
      let err = ErrorHandler.typeError('PlanNotFound', 'Plan does not exist.')
      return next(err)
    } else {
      return next()
    }
  })
}

exports.getRedirectId = (req, res, next) => {
  const applicationId = req.params.applicationId
  const redirectId = req.params.redirectId

  applicationService.redirect.get({
    applicationId: applicationId,
    redirectId: redirectId
  }).then((redirect) => {
    req.redirect = redirect
    return next()
  }).catch((err) => {
    return next(err)
  })
}
