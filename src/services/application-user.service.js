import Promise from 'es6-promise'
import EventEmitter from 'events'
import config from '../config'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from '../services/dyndb.service'
import * as _ from 'lodash'

const logger = LoggerHandler
const path = 'application-user.service'

export default class ApplicationUserService {

  constructor (applicationService) {
    this.dyndbService = new DynDBService()
    this.applicationService = applicationService
  }

  get (userId) {
    const _path = `${path} get ${userId}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.get({
        table: 'user',
        keys: {
          id: userId
        }
      }).then((data) => {
        logger.info(`${_path} result of this.dyndbService.get then`)

        if (data.Item) {
          return resolve(data.Item)
        } else {
          return reject(ErrorHandler.typeError('UserNotFound', 'User does not exist.'))
        }
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  create (userId) {
    const _path = `${path} create ${userId}`
    logger.info(`${_path}`)

    const item = {
      id: userId
    }

    return new Promise((resolve, reject) => {
      this.dyndbService.insert({
        table: 'user',
        item: item
      }).then((item) => {
        logger.info(`${_path} result of this.dyndbService.insert then`)
        return resolve(item)
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.insert catch`)
        return reject(err)
      })
    })
  }

  delete (userId, deleteOrphanApplication = false) {
    const _path = `${path} delete ${userId}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      /* remove user */
      let deleteParams = {
        table: 'user',
        keys: {
          id: userId
        }
      }

      this.dyndbService.delete(deleteParams).then(() => {
        return this.getApplications(userId)
      }).then((items) => {
        let promises = []

        /* remove relationship with application */
        for (let item of items) {
          let deleteParams = {
            table: 'application_user',
            keys: {
              applicationId: item.applicationId,
              userId: item.userId
            }
          }

          let promise = this.dyndbService.delete(deleteParams)
          promises.push(promise)
        }

        /* wait all promises be executed */
        return Promise.all(promises)
      }).then(() => {
        logger.info(`${_path} ${userId} result of promise chain then`)
        return resolve()
      }).catch((err) => {
        logger.error(`${_path} ${userId} result of promise chain catch`, err.name)
        return reject(err)
      })
    })
  }

  /*
   * The information about user is divided between multiples sources,
   * this method consolidate all this information.
   */
  consolidateProfile (parameters) {
    const _path = `${path} consolidateProfile`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const myEmitter = new EventEmitter()
      let getUser; let getApplications

      /*
       * This event receive all information from dyndb
       * and consolidade in one json when all informations
       * are ready.
       * STEP: 3 - see bellow STEP 1 and STEP 2
       */
      myEmitter.on('eventConsolidate', (who, data) => {
        logger.info(`${_path} EventMitter ${who}`)
        logger.info(data)
        if (who === 'getUser') {
          getUser = data
        } else if (who === 'getApplications') {
          getApplications = data
        }

        if (getUser && getApplications) {
          const result = {
            user: getUser,
            applications: getApplications
          }
          return resolve(result)
        }
      })

      /*
       * get or create application info, afterwards send eventConsolidate
       * STEP: 1
       */
      this.getApplications(parameters.userId).then((items) => {
        logger.info(`${_path} result of this.getApplications then`)
        let applicationIds = []

        if (items.length) {
          applicationIds = _.transform(items, (result, obj) => {
            result.push({ id: obj.applicationId })
          })
          myEmitter.emit('eventConsolidate', 'getApplications', applicationIds)
        } else {
          /* it should happen in the first access */
          this.applicationService.create({
            userId: parameters.userId,
            userEmail: parameters.userEmail,
            planId: config.defaultPlanId
          }).then((item) => {
            logger.info(`${_path} result of applicationService.create then`)
            applicationIds.push({ id: item.id })
            myEmitter.emit('eventConsolidate', 'getApplications', applicationIds)
          }).catch((err) => {
            logger.warn(`${_path} result of applicationService.create catch`, err.name)
            return reject(err)
          })
        }
      })

      /*
       * get or create user infor, afterwards send eventConsolidate
       * STEP: 2
       */
      this.get(parameters.userId).then((item) => {
        logger.info(`${_path} result of get then`)
        myEmitter.emit('eventConsolidate', 'getUser', item)
      }).catch((err) => {
        logger.warn(`${_path} result of get catch`, err.name)

        if (err.name === 'UserNotFound') {
          /* it should happen in the first access */
          this.create(parameters.userId).then((item) => {
            logger.info(`${_path} result of create then`)
            myEmitter.emit('eventConsolidate', 'getUser', item)
          }).catch((err) => {
            logger.warn(`${_path} result of create catch`, err.name)
            return reject(err)
          })
        } else {
          return reject(err)
        }
      })
    })
  }

  getProfile (parameters) {
    const _path = `${path} getProfile`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.consolidateProfile({
        userId: parameters.userId,
        userEmail: parameters.userEmail
      }).then((profile) => {
        logger.info(`${_path} result of consolidateProfile then`)
        return resolve(profile)
      }).catch((err) => {
        logger.warn(`${_path} result of consolidateProfile catch`, err.name)
        return reject(err)
      })
    })
  }

  isAuthorized (params) {
    const _path = `${path} isAuthorized`
    logger.info(`${_path}`, params)

    return new Promise((resolve, reject) => {
      this.dyndbService.get({
        table: 'application_user',
        keys: {
          applicationId: params.applicationId,
          userId: params.userId
        }
      }).then((data) => {
        logger.info(`${_path} result of this.dyndbService.get then`)
        if (data.Item) {
          return resolve(true)
        } else {
          return reject(ErrorHandler.typeError('PermissionDenied', 'Permission Denied.'))
        }
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.get catch`, err.name)
        return reject(err)
      })
    })
  }

  getApplications (userId) {
    const _path = `${path} getApplications:${userId}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      const queryParams = {
        table: 'application_user',
        index: 'userId-index',
        keys: {
          userId: userId
        }
      }

      this.dyndbService.query(queryParams).then((data) => {
        logger.info(`${_path} result of this.dyndbService.query then`)
        return resolve(data.Items)
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.query catch`, err.name)
        return reject(err)
      })
    })
  }
}
