import Promise from 'es6-promise'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from '../services/dyndb.service'
import randtoken from 'rand-token'
import Queue from 'bull'

const logger = LoggerHandler
const path = 'application-redirect.service'

export default class ApplicationRedirectService {

  constructor (applicationService) {
    this.dyndbService = new DynDBService()
    this.applicationService = applicationService
    this.fileQueue = Queue('fileConverter')
  }

  get (parameters) {
    const _path = `${path} get`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.dyndbService.get('redirect', {
        applicationId: parameters.applicationId,
        id: parameters.redirectId
      }).then((data) => {
        logger.info(`${_path} result of this.dyndbService.get then`)

        if (data.Items[0]) {
          return resolve(this.redirectResponseHandler(data.Items[0]))
        } else {
          return reject(ErrorHandler.typeError('RedirectNotFound', 'Redirect does not exist.'))
        }
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  create (parameters) {
    const _path = `${path} create`
    logger.info(`${_path}`, parameters)

    const item = parameters
    item.id = randtoken.suid(16)

    return new Promise((resolve, reject) => {
      this.dyndbService.insert('redirect', item).then((item) => {
        logger.info(`${_path} result of this.dyndbService.insert then`)
        return resolve(this.redirectResponseHandler(item))
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.insert catch`)
        return reject(err)
      })
    })
  }

  redirectResponseHandler (redirect) {
    return {
      id: redirect.id,
      hostSources: redirect.hostSources,
      hostTarget: redirect.hostTarget,
      applicationId: redirect.applicationId
      // createdAt: redirect.createdAt,
      // updatedAt: redirect.updatedAt
    }
  }

  delete (parameters) {
    const _path = `${path} delete`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.dyndbService.delete('redirect', {
        applicationId: parameters.applicationId,
        id: parameters.redirectId
      }).then(() => {
        logger.info(`${_path} ${parameters.redirectId} result of this.dyndbService.delete then`)
        return resolve({})
      }).catch((err) => {
        logger.error(`${_path} ${parameters.redirectId} result of this.dyndbService.delete catch`, err.name)
        return reject(err)
      })
    })
  }

  update (parameters, item) {
    const _path = `${path} update`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      return this.dyndbService.update('redirect', {
        id: parameters.redirectId,
        applicationId: parameters.applicationId
      }, item).then((item) => {
        logger.info(`${_path} result of this.dyndbService.update then`)
        return resolve(this.redirectResponseHandler(item))
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.update catch`, err.name)
        return reject(err)
      })
    })
  }

  getByApplicationId (applicationId) {
    const _path = `${path} getByApplicationId ${applicationId}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.get('redirect', {
        applicationId: applicationId,
        limit: 100
      }).then((data) => {
        logger.info(`${_path} result of this.dyndbService.get then`)
        return resolve(data.Items)
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  uploadFile (parameters) {
    const _path = `${path} uploadFile`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.fileQueue.add({
        applicationId: parameters.applicationId,
        redirectId: parameters.redirectId,
        file: parameters.file
      })
    })
  }
}
