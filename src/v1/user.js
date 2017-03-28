import express from 'express'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import ApplicationService from '../services/application.service'
// import path from 'path'

export default () => {
  const router = express.Router()
  const logger = LoggerHandler
  const applicationService = new ApplicationService()
  const getUserId = (fullId) => {
    return fullId.split('|')[1]
  }

  /* Generate Stormpath's Register URL */
  router.get('/profile', (req, res) => {
    const path = req.originalUrl
    const userId = getUserId(req.user.sub)
    const userEmail = req.user.email

    const responseHandler = (profile) => {
      res.status(200).send({
        id: profile.user.id,
        applications: profile.applications
      })
    }

    applicationService.user.getProfile({
      userId: userId,
      userEmail: userEmail
    }).then((profile) => {
      logger.info(`${path} result of applicationService.userService.getProfile then`)
      return responseHandler(profile)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.userService.getProfile catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  return router
}
