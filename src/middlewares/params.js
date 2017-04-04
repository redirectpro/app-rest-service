import LoggerHandler from '../handlers/logger.handler'
import ErrorHandler from '../handlers/error.handler'
import ApplicationService from '../services/application.service'

const logger = LoggerHandler
const applicationService = new ApplicationService()

const getApplicationId = (req, res, next) => {
  const path = 'validateApplicationId'
  const userId = req.user._id
  const applicationId = req.params.applicationId

  applicationService.getByUserId(userId, applicationId).then((data) => {
    logger.info(`${path} result of applicationService.getByUserId then`)
    req.application = data[0]
    return next()
  }).catch((err) => {
    logger.warn(`${path} result of applicationService.getByUserId catch`)

    if (err.name === 'NotFound') {
      err = ErrorHandler.typeError('ApplicationNotFound', 'Application does not exist.')
    }
    return ErrorHandler.responseError(err, req, res)
  })
}

const getPlanId = (req, res, next) => {
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

const getRedirectId = (req, res, next) => {
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

export { getApplicationId, getPlanId, getRedirectId }
