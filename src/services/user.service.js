import EventEmitter from 'events'
import config from '../config'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from '../services/dyndb.service'
import ApplicationService from './application.service'
const logger = LoggerHandler
const path = 'user.service'

export default class UserService {

  constructor () {
    this.applicationService = new ApplicationService()
  }

  create (userId) {
    const _path = `${path} create`
    logger.info(`${_path} ${userId}`)

    const item = {
      id: userId
    }

    return new Promise((resolve, reject) => {
      DynDBService.insertUser(item).then((item) => {
        logger.info(`${_path} result of create then`)
        return resolve(item)
      }).catch((err) => {
        logger.error(`${_path} result of create catch`)
        return reject(err)
      })
    })
  }

  get (userId) {
    const _path = `${path} get`
    logger.info(`${_path} ${userId}`)

    return new Promise((resolve, reject) => {
      DynDBService.getUser({ id: userId }).then((userInfo) => {
        logger.info(`${_path} result of DynDBService then`)

        if (userInfo.Items[0]) {
          resolve(userInfo.Items[0])
        } else {
          reject(ErrorHandler.typeError('UserNotFound', 'User does not exist'))
        }
      }).catch((err) => {
        logger.error(`${_path} result of DynDBService catch`, err.name)
        return reject(err)
      })
    })
  }

  // static createCustomerId (userInfo) {
  //   return new Promise((resolve, reject) => {
  //     if (!userInfo.app_metadata) {
  //       userInfo.app_metadata = { stripe: { } }
  //     }
  //
  //     if (!userInfo.app_metadata.stripe) {
  //       userInfo.app_metadata.stripe = { customer_id: null }
  //     }
  //
  //     global.conn.stripe.customers.create({
  //       email: userInfo.email
  //     }, (err, customer) => {
  //       if (err) reject(err)
  //
  //       userInfo.app_metadata.stripe.customer_id = customer.id
  //       userInfo.app_metadata.stripe.plan_id = 'personal'
  //       global.conn.stripe.subscriptions.create({
  //         customer: customer.id,
  //         plan: userInfo.app_metadata.stripe.plan_id
  //       }, (err, subscription) => {
  //         if (err) reject(err)
  //         userInfo.app_metadata.stripe.subscription_id = subscription.id
  //         global.conn.authManage.users.updateAppMetadata({
  //           id: userInfo.user_id
  //         }, userInfo.app_metadata).then(() => {
  //           resolve(this.validateUserInfo(userInfo))
  //         })
  //       })
  //     })
  //   })
  // }

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
        myEmitter.emit('eventConsolidate', 'getApplications', items)
      }).catch((err) => {
        if (err.name === 'ApplicationsNotFound') {
          logger.error(`${_path} result of applicationService.getByUserId catch`, err.name)

          /* it should happen in the first access */
          this.applicationService.create({
            userId: parameters.userId,
            userEmail: parameters.userEmail,
            planId: config.defaultPlanId
          }).then((item) => {
            const items = [{ id: item.id }]
            logger.info(`${_path} result of applicationService.create then`)
            myEmitter.emit('eventConsolidate', 'getApplication', items)
          }).catch((err) => {
            logger.error(`${_path} result of applicationService.create catch`, err.name)
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
        logger.error(`${_path} result of get catch`, err.name)

        if (err.name === 'UserNotFound') {
          /* it should happen in the first access */
          this.create(parameters.userId).then((item) => {
            logger.info(`${_path} result of create then`)
            myEmitter.emit('eventConsolidate', 'getUser', item)
          }).catch((err) => {
            logger.error(`${_path} result of create catch`, err.name)
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
        logger.error(`${_path} result of consolidateProfile catch`, err.name)
        return reject(err)
      })
    })
  }
}
