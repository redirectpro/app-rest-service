import Promise from 'es6-promise'
import jwt from 'jsonwebtoken'
import config from '../config'
import ApplicatinService from '../services/application.service'

export default class TestUtils {

  constructor () {
    this.applicationService = new ApplicatinService()
  }
  genAccessToken (params) {
    const validUserContent = {
      'email': params.email || 'undefined@redirectpro.io',
      'email_verified': true,
      'iss': 'https://keepat.auth0.com/',
      'sub': params.sub || 'auth0|undefinedLocation',
      'aud': 'n1K6ZPkvgD7eLuKLXCBOy8d3dfnKlTAc',
      'iat': Math.floor(Date.now() / 1000) - 30,
      'exp': Math.floor(Date.now() / 1000) - 30 + 3600
    }

    const validUserToken = jwt.sign(validUserContent, config.jwtSecret)

    return validUserToken
  }

  deleteUser (userId) {
    return this.applicationService.user.getApplications(userId).then((items) => {
      let promises = []

      for (let item of items) {
        let p1 = this.applicationService.delete(item.applicationId)
        let p2 = this.applicationService.user.delete(item.userId)
        promises.push(p1)
        promises.push(p2)
      }
      return Promise.all(promises)
    })
  }

  resetUser (params) {
    return this.deleteUser(params.userId).then(() => {
      return this.applicationService.user.getProfile({
        userId: params.userId,
        userEmail: params.userEmail
      }).then((profile) => {
        return this.getApplication(profile.applications[0].id)
      })
    })
  }

  getApplication (applicationId) {
    return this.applicationService.get(applicationId)
  }

  mockValidator (request, errorParams) {

    const validRequest = {
      // Default validations used
      checkBody: () => { return validRequest },
      checkQuery: () => { return validRequest },
      notEmpty: () => { return validRequest },

      // Custom validations used
      isArray: () => { return validRequest },
      gte: () => { return validRequest },
      isHostName: () => { return validRequest },
      matches: () => { return validRequest },

      // Validation errors
      validationErrors: () => { return false },
      getValidationResult: () => {
        return Promise.resolve({
          isEmpty: () => {
            if (errorParams && errorParams.length > 0) {
              return false
            } else {
              return true
            }
          },
          array: () => {
            let array = []
            if (errorParams) {
              errorParams.forEach((e) => {
                array.push({
                  param: e,
                  msg: `Invalid ${e}`,
                  value: ''
                })
              })
            }
            return array
          }
        })
      }
    }

    // Get de default valid request
    Object.assign(request, validRequest)

    return request
  }

}
