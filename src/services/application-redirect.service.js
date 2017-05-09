import Promise from 'es6-promise'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from '../services/dyndb.service'
import randtoken from 'rand-token'
import conn from '../connections'
import * as fs from 'fs'

export default class ApplicationRedirectService {

  constructor (applicationService) {
    this.path = 'ApplicationRedirectService'
    this.logger = new LoggerHandler()
    this.dyndbService = new DynDBService()
    this.applicationService = applicationService
    this.fileConverter = conn.bull.fileConverter
    this.fileReceiver = conn.bull.fileReceiver
    this.logger.info(`${this.path} constructor`)
  }

  get (parameters) {
    const _path = `${this.path} get`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.dyndbService.get({
        table: 'redirect',
        keys: {
          applicationId: parameters.applicationId,
          id: parameters.redirectId
        }
      }).then((data) => {
        this.logger.info(`${_path} result of this.dyndbService.get then`)

        if (data.Item) {
          return resolve(this.redirectResponseHandler(data.Item))
        } else {
          return reject(ErrorHandler.typeError('RedirectNotFound', 'Redirect does not exist.'))
        }
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  create (parameters) {
    const _path = `${this.path} create`
    this.logger.info(`${_path}`, parameters)

    const item = parameters
    item.id = randtoken.suid(16)

    return new Promise((resolve, reject) => {
      this.dyndbService.insert({
        table: 'redirect',
        item: item
      }).then((item) => {
        this.logger.info(`${_path} result of this.dyndbService.insert then`)
        return resolve(this.redirectResponseHandler(item))
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.insert catch`)
        return reject(err)
      })
    })
  }

  redirectResponseHandler (redirect) {
    return {
      id: redirect.id,
      hostSources: redirect.hostSources,
      targetHost: redirect.targetHost,
      targetProtocol: redirect.targetProtocol,
      // applicationId: redirect.applicationId
      createdAt: redirect.createdAt,
      updatedAt: redirect.updatedAt
    }
  }

  delete (parameters) {
    const _path = `${this.path} delete`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.dyndbService.delete({
        table: 'redirect',
        keys: {
          applicationId: parameters.applicationId,
          id: parameters.redirectId
        }
      }).then(() => {
        this.logger.info(`${_path} ${parameters.redirectId} result of this.dyndbService.delete then`)
        return resolve({})
      }).catch((err) => {
        this.logger.error(`${_path} ${parameters.redirectId} result of this.dyndbService.delete catch`, err.name)
        return reject(err)
      })
    })
  }

  update (parameters, item) {
    const _path = `${this.path} update`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      return this.dyndbService.update('redirect', {
        id: parameters.redirectId,
        applicationId: parameters.applicationId
      }, item).then((item) => {
        this.logger.info(`${_path} result of this.dyndbService.update then`)
        item.id = parameters.redirectId
        return resolve(this.redirectResponseHandler(item))
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.update catch`, err.name)
        return reject(err)
      })
    })
  }

  getByApplicationId (applicationId) {
    const _path = `${this.path} getByApplicationId ${applicationId}`
    this.logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.query({
        table: 'redirect',
        keys: {
          applicationId: applicationId
        }
      }).then((data) => {
        this.logger.info(`${_path} result of this.dyndbService.get then`)
        return resolve(data.Items)
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  setByFileFromTo (parameters) {
    const _path = `${this.path} setByFileFromTo`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      fs.readFile(parameters.file, (err, data) => {
        if (err) return reject(err)

        this.fileConverter.add({
          applicationId: parameters.applicationId,
          redirectId: parameters.redirectId,
          fileData: data.toJSON()
        }).then((data) => {
          resolve({
            queue: 'fileConverter',
            jobId: data.jobId
          })
        })
      })
    })
  }

  setByJsonFromTo (parameters) {
    const _path = `${this.path} setByJsonFromTo`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve) => {
      this.fileConverter.add({
        applicationId: parameters.applicationId,
        redirectId: parameters.redirectId,
        jsonData: parameters.data
      }).then((data) => {
        resolve({
          queue: 'fileConverter',
          jobId: data.jobId
        })
      })
    })
  }

  getFromToFile (parameters) {
    const _path = `${this.path} getFromToFile`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve) => {
      this.fileReceiver.add({
        applicationId: parameters.applicationId,
        redirectId: parameters.redirectId
      }).then((data) => {
        resolve({
          queue: 'fileReceiver',
          jobId: data.jobId
        })
      })
    })
  }

  getJob (parameters) {
    const _path = `${this.path} getJob`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      let queue = null

      if (parameters.queue === 'fileConverter') {
        queue = this.fileConverter
      } else if (parameters.queue === 'fileReceiver') {
        queue = this.fileReceiver
      } else {
        return reject({ message: `Queue Not Found.` })
      }

      queue.getJob(parameters.jobId).then((data) => {
        const errMessage = 'Invalid jobId.'

        if (!data || !data.data || !data.data.applicationId || !data.data.redirectId) {
          return reject({ message: errMessage })
        }

        const _applicationId = data.data.applicationId
        const _redirectId = data.data.redirectId
        let returnValue = null

        if (data.returnvalue && typeof (data.returnvalue) === 'object') {
          returnValue = data.returnvalue
        }

        if (_applicationId === parameters.applicationId && _redirectId === parameters.redirectId) {
          resolve({
            progress: data._progress,
            failedReason: data.failedReason,
            returnValue: returnValue
          })
        } else {
          reject({ message: errMessage })
        }
      })
    })
  }

}
