var jwt = require('jsonwebtoken');

let validUserContent = {
  'email': 'udlei@nati.biz',
  'email_verified': true,
  'iss': 'https://keepat.eu.auth0.com/',
  'sub': 'auth0|588930ba74e3aa709a591788',
  'aud': 'n1K6ZPkvgD7eLuKLXCBOy8d3dfnKlTAc',
  'iat': Math.floor(Date.now() / 1000) - 30,
  'exp': Math.floor(Date.now() / 1000) - 30 + 3600
}

const validUserToken = jwt.sign(validUserContent, process.env.JWT_SECRET)

console.log(validUserToken)
