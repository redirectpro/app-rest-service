import ErrorHandler from '../../handlers/error.handler'
import LoggerHandler from '../../handlers/logger.handler'
import ApplicationService from '../../services/application.service'

const error = new ErrorHandler()
const logger = new LoggerHandler()
const applicationService = new ApplicationService()

exports.getProfile = (req, res) => {
  const userId = req.user._id
  const userEmail = req.user.email
  const path = `user.getProfile id:${userId}`

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
    return error.response(err, req, res)
  })
}
