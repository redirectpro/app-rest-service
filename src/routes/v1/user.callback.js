import ErrorHandler from '../../handlers/error.handler'
import LoggerHandler from '../../handlers/logger.handler'
import ApplicationService from '../../services/application.service'

const logger = new LoggerHandler()
const applicationService = new ApplicationService()

exports.getUserProfile = (req, res) => {
  const path = req.originalUrl
  const userId = req.user._id
  const userEmail = req.user.email

  const responseHandler = (profile) => {
    return res.status(200).send({
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
}
