import ErrorHandler from '../handlers/error.handler'
// import conn from '../connections'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from './dyndb.service'
import StripeService from './stripe.service'
const logger = LoggerHandler
const path = 'application.service'

export default class ApplicationService {

  constructor () {
    this.stripeService = new StripeService()
  }

  create (parameters) {
    const _path = `${path} create`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      this.stripeService.create({
        userEmail: parameters.userEmail,
        planId: parameters.planId
      }).then((customer) => {
        logger.info(`${_path} result of stripeService.create then`)

        const item = {
          id: customer.id,
          users: [ parameters.userId ],
          billingEmail: parameters.userEmail,
          plan: {
            id: parameters.planId
          }
        }

        DynDBService.insertApplication(item).then((item) => {
          logger.info(`${_path} result of DynDBService.insertApplication then`)
          return resolve(item)
        }).catch((err) => {
          logger.error(`${_path} result of DynDBService.insertApplication catch`)
          return reject(err)
        })
      }).catch((err) => {
        logger.error(`${_path} result of stripeService.create catch`, err.name)
        reject(err)
      })
    })

    // const item = {
    //   userId: parameters.userId
    // }
    //
    // return new Promise((resolve, reject) => {
    //   DynDBService.insertApplication(item).then((item) => {
    //     return resolve(item)
    //   }).catch((err) => {
    //     return reject(err)
    //   })
    // })
  }

  getByUserId (userId) {
    const _path = `${path} getByUserId`
    logger.info(`${_path} ${userId}`)
    return new Promise((resolve, reject) => {
      DynDBService.getApplicationByUserId({ id: userId }).then((applicationInfo) => {
        logger.info(`${_path} result of getApplicationByUserId then`)

        if (applicationInfo.Count > 0) {
          resolve(applicationInfo.Items)
        } else {
          reject(ErrorHandler.typeError('ApplicationsNotFound', 'Applications does not exist'))
        }
      }).catch((err) => {
        logger.error(`${_path} result of getByUserId catch`, err.name)
        return reject(err)
      })
    })
  }

}
