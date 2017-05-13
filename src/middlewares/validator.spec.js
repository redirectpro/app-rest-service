import chai from 'chai'
import validator from './validator'
const expect = chai.expect

describe('./middlewares/validator', () => {
  it('expressValidator', (done) => {
    let req = {
      body: {
        array: [],
        hostArray: [ 'bbc.co.uk', 'dw.de' ],
        hostArray2: [ 'dwde' ],
        host: 'domain.com',
        host2: 'domaincom'
      }
    }
    validator()(req, null, () => {
      req.checkBody('array', 'Invalid array').isArray()
      req.checkBody('hostArray', 'Invalid hostArray').isHostName()
      req.checkBody('hostArray2', 'Invalid hostArray2').isHostName()
      req.checkBody('host', 'Invalid host').isHostName()
      req.checkBody('host2', 'Invalid host2').isHostName()
      expect(req._validationErrors[0].param).to.be.equal('hostArray2')
      expect(req._validationErrors[0].msg).to.be.equal('Invalid hostArray2')
      expect(req._validationErrors[1].param).to.be.equal('host2')
      expect(req._validationErrors[1].msg).to.be.equal('Invalid host2')
      done()
    })
  })
})
