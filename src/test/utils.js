import Promise from 'es6-promise'
import jwt from 'jsonwebtoken'
import config from '../config'
import ApplicatinService from '../services/application.service'

export default class TestUtils {

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
    const applicationService = new ApplicatinService()

    return applicationService.user.getApplications(userId).then((items) => {
      let promises = []

      for (let item of items) {
        let p1 = applicationService.delete(item.applicationId)
        let p2 = applicationService.user.delete(item.userId)
        promises.push(p1)
        promises.push(p2)
      }
      return Promise.all(promises)
    })
  }
}
