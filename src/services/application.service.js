import Promise from 'es6-promise'
import ErrorHandler from '../handlers/error.handler'
import LoggerHandler from '../handlers/logger.handler'
import DynDBService from './dyndb.service'
import StripeService from './stripe.service'
import ApplicationUserService from './application-user.service'
import ApplicationBillingService from './application-billing.service'
import ApplicationRedirectService from './application-redirect.service'

export default class ApplicationService {

  constructor () {
    this.path = 'ApplicationService'
    this.logger = new LoggerHandler()
    this.stripeService = new StripeService()
    this.dyndbService = new DynDBService()
    this.user = new ApplicationUserService(this)
    this.billing = new ApplicationBillingService(this)
    this.redirect = new ApplicationRedirectService(this)
    this.logger.info(`${this.path} constructor`)
  }

  get (applicationId) {
    const _path = `${this.path} get`
    this.logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      const getParams = {
        table: 'application',
        keys: {
          id: applicationId
        }
      }
      this.dyndbService.get(getParams).then((data) => {
        this.logger.info(`${_path} result of this.dyndbService.get then`)

        if (data.Item) {
          return resolve(data.Item)
        } else {
          return reject(ErrorHandler.typeError('ApplicationNotFound', 'Application does not exist.'))
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

    return new Promise((resolve, reject) => {
      this.stripeService.create({
        userEmail: parameters.userEmail,
        planId: parameters.planId
      }).then((customer) => {
        this.logger.info(`${_path} result of stripeService.create then`)
        this.logger.debug(customer)

        const p1Param = {
          table: 'application',
          item: {
            id: customer.id,
            billingEmail: parameters.userEmail,
            subscription: this.billing.subscriptionResponseHandler(customer.subscriptions.data[0])
          }
        }

        const p2Param = {
          table: 'application_user',
          item: {
            applicationId: customer.id,
            userId: parameters.userId
          }
        }

        const p1 = this.dyndbService.insert(p1Param)
        const p2 = this.dyndbService.insert(p2Param)

        Promise.all([p1, p2]).then((values) => {
          this.logger.info(`${_path} result of promise chain then`)
          return resolve(values[0])
        }).catch((err) => {
          this.logger.info(`${_path} result of promise.chain catch`)
          return reject(err)
        })
      }).catch((err) => {
        this.logger.warn(`${_path} result of promise chain catch`, err.name, err.message)
        return reject(err)
      })
    })
  }

  delete (applicationId) {
    const _path = `${this.path} delete`
    this.logger.info(`${_path} ${applicationId}`)

    return new Promise((resolve, reject) => {
      let deleteParams = {
        table: 'application',
        keys: {
          id: applicationId
        }
      }
      let p1 = this.stripeService.delete(applicationId)
      let p2 = this.dyndbService.delete(deleteParams)
      let p3 = this.getUsers(applicationId)

      Promise.all([p1, p2, p3]).then((values) => {
        const items = values[2]
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

        return Promise.all(promises)
      }).then(() => {
        resolve()
      }).catch((err) => {
        if (err.message === `No such customer: ${applicationId}`) {
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  getUsers (applicationId) {
    const _path = `${this.path} getUsers:${applicationId}`
    this.logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      const queryParams = {
        table: 'application_user',
        keys: {
          applicationId: applicationId
        }
      }

      this.dyndbService.query(queryParams).then((data) => {
        this.logger.info(`${_path} result of this.dyndbService.query then`)
        return resolve(data.Items)
      }).catch((err) => {
        this.logger.warn(`${_path} result of this.dyndbService.query catch`, err.name)
        return reject(err)
      })
    })
  }

}
