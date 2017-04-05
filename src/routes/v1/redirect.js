import express from 'express'
import LoggerHandler from '../../handlers/logger.handler'
import ErrorHandler from '../../handlers/error.handler'
import ApplicationService from '../../services/application.service'
import { getApplicationId, getRedirectId } from '../../middlewares/params'

export default () => {
  const router = express.Router()
  const logger = LoggerHandler
  const applicationService = new ApplicationService()

  router.get('/:applicationId/redirects', getApplicationId, (req, res) => {
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
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.post('/:applicationId/redirect', getApplicationId, (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const hostSources = req.body.hostSources
    const hostTarget = req.body.hostTarget

    const responseHandler = (res, redirect) => {
      return res.status(200).send(redirect)
    }

    applicationService.redirect.create({
      applicationId: applicationId,
      hostSources: hostSources,
      hostTarget: hostTarget
    }).then((redirect) => {
      logger.info(`${path} result of applicationService.redirect.create then`)
      return responseHandler(res, redirect)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.redirect.create catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.get('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, (req, res) => {
    const responseHandler = (res, redirect) => {
      return res.status(200).send(redirect)
    }

    return responseHandler(res, req.redirect)
  })

  router.delete('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, (req, res) => {
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
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.put('/:applicationId/redirect/:redirectId', getApplicationId, getRedirectId, (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const redirectId = req.params.redirectId
    const hostSources = req.body.hostSources
    const hostTarget = req.body.hostTarget

    const responseHandler = (res, redirect) => {
      return res.status(200).send(redirect)
    }

    applicationService.redirect.update({
      redirectId: redirectId,
      applicationId: applicationId
    }, {
      hostSources: hostSources,
      hostTarget: hostTarget
    }).then((redirect) => {
      logger.info(`${path} result of applicationService.redirect.create then`)
      return responseHandler(res, redirect)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.redirect.create catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  router.post('/:applicationId/redirect/:redirectId/upload', getApplicationId, getRedirectId, (req, res) => {
    const path = req.originalUrl
    const applicationId = req.params.applicationId
    const redirectId = req.params.redirectId

    const responseHandler = (res, redirect) => {
      return res.status(200).send(redirect)
    }

    applicationService.redirect.uploadFile({
      redirectId: redirectId,
      applicationId: applicationId,
      file: '/tmp/arquivo.xlsx'
    }).then((data) => {
      logger.info(`${path} result of applicationService.redirect.uploadFile then`)
      return responseHandler(res, data)
    }).catch((err) => {
      logger.warn(`${path} result of applicationService.redirect.uploadFile catch`)
      return ErrorHandler.responseError(err, req, res)
    })
  })

  return router
}
