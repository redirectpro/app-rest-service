import Promise from 'es6-promise'
import cuid from 'cuid'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from '../services/dyndb.service'
import conn from '../connections'
import * as fs from 'fs'

export default class ApplicationRedirectService {

  constructor (applicationService) {
    this.path = 'ApplicationRedirectService'
    this.error = new ErrorHandler()
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
      let result

      this.dyndbService.get({
        table: 'redirect',
        keys: {
          applicationId: parameters.applicationId,
          id: parameters.redirectId
        }
      }).then((data) => {
        this.logger.info(`${_path} result of this.dyndbService.get then`)

        result = data.Item

        if (result) {
          return this.getHostSources({
            applicationId: parameters.applicationId,
            redirectId: parameters.redirectId
          })
        } else {
          return reject(this.error.custom('RedirectNotFound', 'Redirect does not exist.'))
        }
      }).then((hostSources) => {
        result.hostSources = hostSources
        return resolve(this.redirectResponseHandler(result))
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  create (parameters) {
    let result
    const _path = `${this.path} create`
    this.logger.info(`${_path}`, parameters)

    const item = parameters
    const hostSources = item.hostSources
    delete item.hostSources

    item.id = cuid()

    return new Promise((resolve, reject) => {
      this.dyndbService.insert({
        table: 'redirect',
        item: item
      }).then((resultItem) => {
        this.logger.info(`${_path} result of this.dyndbService.insert then`)
        result = resultItem

        return this.createHostSources({
          applicationId: item.applicationId,
          redirectId: item.id,
          hostSources: hostSources
        })
      }).then((values) => {
        result.hostSources = values
        return resolve(this.redirectResponseHandler(result))
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.insert catch`)
        return reject(err)
      })
    })
  }

  createHostSources (parameters) {
    const _path = `${this.path} createHostSources`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      let promises = []

      if (parameters.hostSources === undefined || parameters.hostSources.length <= 0) {
        return reject(this.error.custom('SourceHostsMustBeInformed', 'Source hosts must be informed.'))
      }

      parameters.hostSources.forEach((e) => {
        let promise = this.dyndbService.insert({
          table: 'redirect_hostsource',
          item: {
            hostsource: e,
            applicationId: parameters.applicationId,
            redirectId: parameters.redirectId
          }
        })
        promises.push(promise)
      })

      Promise.all(promises).then(() => {
        this.logger.info(`${_path} result of this.dyndbService.insert chain then`)
        return resolve(parameters.hostSources)
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.insert chain catch`)
        return reject(err)
      })
    })
  }

  deleteHostSources (parameters) {
    const _path = `${this.path} deleteHostSources`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.getHostSources({
        applicationId: parameters.applicationId,
        redirectId: parameters.redirectId
      }).then((hostsources) => {
        let promises = []

        hostsources.forEach((e) => {
          const deleteParams = {
            table: 'redirect_hostsource',
            keys: {
              hostsource: e
            }
          }
          const promise = this.dyndbService.delete(deleteParams)
          promises.push(promise)
        })

        Promise.all(promises).then(() => {
          this.logger.info(`${_path} result of this.dyndbService.delete chain then`)
          return resolve({})
        }).catch((err) => {
          this.logger.warn(`${_path} result of this.dyndbService.delete chain then`)
          return reject(err)
        })
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.getHostSources catch`, err.name)
        return reject(err)
      })
    })
  }

  updateHostSources (parameters) {
    const _path = `${this.path} updateHostSources`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.deleteHostSources({
        applicationId: parameters.applicationId,
        redirectId: parameters.redirectId
      }).then(() => {
        this.logger.info(`${_path} result of this.deleteHostSources chain then`)
        return this.createHostSources({
          applicationId: parameters.applicationId,
          redirectId: parameters.redirectId,
          hostSources: parameters.hostSources
        })
      }).then((values) => {
        this.logger.info(`${_path} result of this.createHostSources chain then`)
        return resolve(values)
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.deleteHostSources catch`, err.name)
        return reject(err)
      })
    })
  }

  getHostSources (parameters) {
    const _path = `${this.path} getHostSources`
    this.logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const queryParams = {
        table: 'redirect_hostsource',
        index: 'applicationId-redirectId-index',
        keys: {
          applicationId: parameters.applicationId,
          redirectId: parameters.redirectId
        }
      }

      this.dyndbService.query(queryParams).then((data) => {
        this.logger.info(`${_path} result of this.dyndbService.query then`)

        let hostSources = []

        data.Items.forEach((e) => {
          hostSources.push(e.hostsource)
        })

        return resolve(hostSources)
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.query catch`, err.name)
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

        return this.deleteHostSources({
          applicationId: parameters.applicationId,
          redirectId: parameters.redirectId
        })
      }).then(() => {
        this.logger.info(`${_path} ${parameters.redirectId} result of this.deleteHostSources then`)
        return resolve({})
      }).catch((err) => {
        this.logger.warn(`${_path} ${parameters.redirectId} result of promise chain catch`, err.name)
        return reject(err)
      })
    })
  }

  update (parameters, item) {
    const _path = `${this.path} update`
    this.logger.info(`${_path}`, parameters)

    const hostSources = item.hostSources
    delete item.hostSources

    return new Promise((resolve, reject) => {
      let result

      return this.dyndbService.update({
        table: 'redirect',
        keys: {
          id: parameters.redirectId,
          applicationId: parameters.applicationId
        },
        item: item
      }).then((item) => {
        this.logger.info(`${_path} result of this.dyndbService.update then`)
        result = item
        result.id = parameters.redirectId

        return this.updateHostSources({
          applicationId: parameters.applicationId,
          redirectId: parameters.redirectId,
          hostSources: hostSources
        })
      }).then((values) => {
        result.hostSources = values
        return resolve(this.redirectResponseHandler(result))
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
      let items

      this.dyndbService.query({
        table: 'redirect',
        keys: {
          applicationId: applicationId
        }
      }).then((data) => {
        this.logger.info(`${_path} result of this.dyndbService.get then`)
        items = data.Items

        /* Zero items */
        if (items.length <= 0) {
          return resolve(items)

        /* Get sourcehosts from items */
        } else {
          let promises = []

          items.forEach((e) => {
            let promise = this.getHostSources({
              applicationId: e.applicationId,
              redirectId: e.id
            })
            promises.push(promise)
          })

          return Promise.all(promises)
        }
      }).then((values) => {
        values.forEach((e, index) => {
          items[index].hostSources = e
        })
        resolve(items)
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
