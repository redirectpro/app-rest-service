import LoggerHandler from '../handlers/logger.handler'
import ErrorHandler from '../handlers/error.handler'
import ApplicationService from '../services/application.service'

const logger = LoggerHandler
const applicationService = new ApplicationService()

exports.getApplicationId = (req, res, next) => {
  const path = 'getApplicationId'
  const userId = req.user._id
  const applicationId = req.params.applicationId

  applicationService.user.isAuthorized({
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
    return ErrorHandler.responseError(err, req, res)
  })
}

exports.getPlanId = (req, res, next) => {
  const planId = req.params.planId
  applicationService.billing.getPlans().then((plans) => {
    const plan = plans.find(item => item.id === planId)
    req.applicationPlans = plans

    if (!plan) {
      let err = ErrorHandler.typeError('PlanNotFound', 'Plan does not exist.')
      return next(err)
    } else {
      return next()
    }
  }).catch((err) => {
    return next(err)
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
