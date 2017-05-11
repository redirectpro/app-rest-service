import LoggerHandler from '../../handlers/logger.handler'
import ErrorHandler from '../../handlers/error.handler'
import ApplicationService from '../../services/application.service'
import { IncomingForm } from 'formidable'

const error = new ErrorHandler()
const logger = new LoggerHandler()
const applicationService = new ApplicationService()

exports.getRedirects = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId

  const responseHandler = (res, redirects) => {
    return res.status(200).send(redirects)
  }

  applicationService.redirect.getByApplicationId(applicationId).then((redirects) => {
    logger.info(`${path} result of applicationService.redirect.getByApplicationId then`)
    return responseHandler(res, redirects)
  }).catch((err) => {
    logger.warn(`${path} result of applicationService.redirect.getByApplicationId catch`)
    return error.response(err, req, res)
  })
}

exports.postRedirect = (req, res) => {
  const path = req.originalUrl

  /* Validate params */
  req.checkBody('hostSources', 'Invalid hostSources').notEmpty().isArray().isHostName()
  req.checkBody('targetHost', 'Invalid targetHost').notEmpty().isHostName()
  req.checkBody('targetProtocol', 'Invalid targetProtocol').notEmpty().matches('^http$|^https$')

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) return res.status(400).send(result.array())

    const applicationId = req.params.applicationId
    const hostSources = req.body.hostSources
    const targetHost = req.body.targetHost
    const targetProtocol = req.body.targetProtocol

    const responseHandler = (res, redirect) => {
      return res.status(200).send(redirect)
    }

    applicationService.redirect.create({
      applicationId: applicationId,
      hostSources: hostSources,
      targetHost: targetHost,
      targetProtocol: targetProtocol
    }).then((redirect) => {
      logger.info(`${path} result of applicationService.redirect.create then`)
      return responseHandler(res, redirect)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.redirect.create catch`)
      return error.response(err, req, res)
    })
  })
}

exports.getRedirect = (req, res) => {
  const responseHandler = (res, redirect) => {
    return res.status(200).send(redirect)
  }

  return responseHandler(res, req.redirect)
}

exports.deleteRedirect = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId
  const redirectId = req.params.redirectId

  const responseHandler = (res, redirect) => {
    return res.status(200).send(redirect)
  }

  applicationService.redirect.delete({
    applicationId: applicationId,
    redirectId: redirectId
  }).then((redirect) => {
    logger.info(`${path} result of applicationService.redirect.delete then`)
    return responseHandler(res, redirect)
  }).catch((err) => {
    logger.warn(`${path} result of applicationService.redirect.delete catch`)
    return error.response(err, req, res)
  })
}

exports.putRedirect = (req, res) => {
  const path = req.originalUrl

  /* Validate params */
  req.checkBody('hostSources', 'Invalid hostSources').notEmpty().isArray().isHostName()
  req.checkBody('targetHost', 'Invalid targetHost').notEmpty().isHostName()
  req.checkBody('targetProtocol', 'Invalid targetProtocol').notEmpty().matches('^http$|^https$')

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) return res.status(400).send(result.array())

    const applicationId = req.params.applicationId
    const redirectId = req.params.redirectId
    const hostSources = req.body.hostSources
    const targetHost = req.body.targetHost
    const targetProtocol = req.body.targetProtocol

    const responseHandler = (res, redirect) => {
      return res.status(200).send(redirect)
    }

    applicationService.redirect.update({
      redirectId: redirectId,
      applicationId: applicationId
    }, {
      hostSources: hostSources,
      targetHost: targetHost,
      targetProtocol: targetProtocol
    }).then((redirect) => {
      logger.info(`${path} result of applicationService.redirect.create then`)
      return responseHandler(res, redirect)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.redirect.create catch`)
      return error.response(err, req, res)
    })
  })
}

exports.postRedirectFromTo = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId
  const redirectId = req.params.redirectId
  const contentType = req.headers['content-type']

  const responseHandler = (res, redirect) => {
    return res.status(200).send(redirect)
  }

  if (contentType &&
    (contentType.indexOf('multipart') >= 0 || contentType.indexOf('octet-stream') >= 0)) {
    const form = new IncomingForm()

    form.parse(req, (err, fields, files) => {
      if (err) return error.response(err, req, res)

      applicationService.redirect.setByFileFromTo({
        redirectId: redirectId,
        applicationId: applicationId,
        file: files.file.path
      }).then((data) => {
        logger.info(`${path} result of applicationService.redirect.setByFileFromTo then`)
        return responseHandler(res, data)
      }).catch((err) => {
        logger.warn(`${path} result of applicationService.redirect.setByFileFromTo catch`)
        return error.response(err, req, res)
      })
    })
  } else if (contentType && contentType === 'application/json') {
    applicationService.redirect.setByJsonFromTo({
      redirectId: redirectId,
      applicationId: applicationId,
      data: req.body
    }).then((data) => {
      logger.info(`${path} result of applicationService.redirect.setByJsonFromTo then`)
      return responseHandler(res, data)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.redirect.setByJsonFromTo catch`)
      return error.response(err, req, res)
    })
  } else {
    return responseHandler(res, { })
  }
}

exports.getRedirectFromTo = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId
  const redirectId = req.params.redirectId

  const responseHandler = (res, job) => {
    return res.status(200).send(job)
  }

  applicationService.redirect.getFromToFile({
    redirectId: redirectId,
    applicationId: applicationId
  }).then((data) => {
    logger.info(`${path} result of applicationService.redirect.getFromToFile then`)
    return responseHandler(res, data)
  }).catch((err) => {
    logger.warn(`${path} result of applicationService.redirect.getFromToFile catch`)
    return error.response(err, req, res)
  })
}

exports.getRedirectJob = (req, res) => {
  const path = req.originalUrl
  const applicationId = req.params.applicationId
  const redirectId = req.params.redirectId
  const jobId = req.params.jobId
  const queue = req.params.queue

  const responseHandler = (res, job) => {
    return res.status(200).send(job)
  }

  applicationService.redirect.getJob({
    queue: queue,
    redirectId: redirectId,
    applicationId: applicationId,
    jobId: jobId
  }).then((job) => {
    logger.info(`${path} result of applicationService.redirect.getJob then`)
    return responseHandler(res, job)
  }).catch((err) => {
    logger.warn(`${path} result of applicationService.redirect.getJob catch`)
    return error.response(err, req, res)
  })
}
