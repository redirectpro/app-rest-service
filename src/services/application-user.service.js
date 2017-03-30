import Promise from 'es6-promise'
import EventEmitter from 'events'
import config from '../config'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from '../services/dyndb.service'
import * as _ from 'lodash'

const logger = LoggerHandler
const path = 'application-user.service'

export default class ApplicationUser {

  constructor (applicationService) {
    this.dyndbService = new DynDBService()
    this.applicationService = applicationService
  }

  get (userId) {
    const _path = `${path} get`
    logger.info(`${_path} ${userId}`)

    return new Promise((resolve, reject) => {
      this.dyndbService.get('user', { id: userId }).then((data) => {
        logger.info(`${_path} result of this.dyndbService.get then`)

        if (data.Items[0]) {
          return resolve(data.Items[0])
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
    const _path = `${path} create`
    logger.info(`${_path} ${userId}`)

    const item = {
      id: userId
    }

    return new Promise((resolve, reject) => {
      this.dyndbService.insert('user', item).then((item) => {
        logger.info(`${_path} result of this.dyndbService.insert then`)
        return resolve(item)
      }).catch((err) => {
        logger.warn(`${_path} result of this.dyndbService.insert catch`)
        return reject(err)
      })
    })
  }

  delete (userId, deleteOrphanApplication = false) {
    const _path = `${path} delete`
    logger.info(`${_path} ${userId}`)

    return new Promise((resolve, reject) => {
      const removeUser = this.applicationService.removeUser(userId, deleteOrphanApplication)
      const deleteUser = this.dyndbService.delete('user', userId)

      Promise.all([removeUser, deleteUser]).then(() => {
        logger.info(`${_path} ${userId} result of Promise.all then`)
        return resolve()
      }).catch((err) => {
        logger.error(`${_path} ${userId} result of Promise.all catch`, err.name)
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
          return resolve({
            user: getUser,
            applications: getApplications
          })
        }
      })

      /*
       * get or create application info, afterwards send eventConsolidate
       * STEP: 1
       */
      this.applicationService.getByUserId(parameters.userId).then((items) => {
        logger.info(`${_path} result of applicationService.getByUserId then`)
        logger.debug(items)
        const transformItems = _.transform(items, (result, obj) => {
          result.push({'id': obj.id})
        }, [])
        myEmitter.emit('eventConsolidate', 'getApplications', transformItems)
      }).catch((err) => {
        if (err.name === 'NotFound') {
          logger.warn(`${_path} result of applicationService.getByUserId catch`, err.name)

          /* it should happen in the first access */
          this.applicationService.create({
            userId: parameters.userId,
            userEmail: parameters.userEmail,
            planId: config.defaultPlanId
          }).then((item) => {
            const items = [{ id: item.id }]
            logger.info(`${_path} result of applicationService.create then`)
            myEmitter.emit('eventConsolidate', 'getApplications', items)
          }).catch((err) => {
            logger.warn(`${_path} result of applicationService.create catch`, err.name)
            return reject(err)
          })
        } else {
          return reject(err)
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
}
