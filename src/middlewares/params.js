import { Router } from 'express'
import ApplicationService from '../services/application.service'
import ErrorHandler from '../handlers/error.handler'

export default () => {
  let routes = Router()

  const applicationService = new ApplicationService()

  routes.get('/v1/*/:applicationId/*', (req, res, next) => {
    const userId = req.user._id
    const applicationId = req.params.applicationId
    applicationService.getByUserId(userId, applicationId).then((data) => {
      next()
    }).catch((err) => {
      if (err.name === 'NotFound') {
        err = ErrorHandler.typeError('ApplicationNotFound', 'Application does not exist.')
      }
      next(err)
    })
  })

  return routes
}
