import jwt from 'jsonwebtoken'
import config from '../config'

export default class TestUtils {
  genAccessToken (params) {
    const validUserContent = {
      'email': params.email || 'undefined@redirectpro.io',
      'email_verified': true,
      'iss': 'https://keepat.eu.auth0.com/',
      'sub': params.sub || 'auth0|undefinedLocation',
      'aud': 'n1K6ZPkvgD7eLuKLXCBOy8d3dfnKlTAc',
      'iat': Math.floor(Date.now() / 1000) - 30,
      'exp': Math.floor(Date.now() / 1000) - 30 + 3600
    }

    const validUserToken = jwt.sign(validUserContent, config.jwtSecret)

    return validUserToken
  }
}
