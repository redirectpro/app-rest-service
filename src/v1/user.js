import express from 'express'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import UserService from '../services/user.service'
// import path from 'path'

export default () => {
  const router = express.Router()
  const logger = LoggerHandler
  const getUserId = (fullId) => {
    return fullId.split('|')[1]
  }
  const userService = new UserService()

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

    userService.getProfile({
      userId: userId,
      userEmail: userEmail
    }).then((profile) => {
      logger.info(`${path} result of UserService.getProfile then`)
      return responseHandler(profile)
    }).catch((err) => {
      logger.error(`${path} result of UserService.getProfile catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  return router
}
