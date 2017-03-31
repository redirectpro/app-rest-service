var jwt = require('jsonwebtoken');
var stripe = require('stripe');

let validUserContent = {
  'email': 'testBillingSpecId@redirectpro.io',
  'email_verified': true,
  'iss': 'https://keepat.eu.auth0.com/',
  'sub': 'auth0|testBillingSpecId',
  'aud': 'n1K6ZPkvgD7eLuKLXCBOy8d3dfnKlTAc',
  'iat': Math.floor(Date.now() / 1000) - 30,
  'exp': Math.floor(Date.now() / 1000) - 30 + 3600
}

const validUserToken = jwt.sign(validUserContent, process.env.JWT_SECRET)

console.log('-- access token --')
console.log(validUserToken)
console.log('')

var stripeClient = stripe(process.env.STRIPE_SECRET_KEY)
let content = {
  card: { 
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2020,
    cvc: 123
  }
}

console.log('-- credit card token --')
stripeClient.tokens.create(content, (err, validToken) => {
  console.log('last4 4242 ' + validToken.id)
});

content.card.number = '5555555555554444'
stripeClient.tokens.create(content, (err, validToken) => {
  console.log('last4 4444 ' + validToken.id)
});
