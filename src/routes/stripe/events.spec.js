import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '../../test/app'
const expect = chai.expect

chai.use(chaiHttp)

describe('./stripe/events', () => {
  it('should fail, return invalid event', (done) => {
    chai.request(app)
      .post('/stripe/events')
      .end((err, res) => {
        expect(err).to.be.not.null
        expect(res).to.have.status(500)
        expect(res).to.be.json
        expect(res.body.message).to.be.equal('Invalid event.')
        done()
      })
  })

  it('should fail, event not found', (done) => {
    chai.request(app)
      .post('/stripe/events')
      .send({
        id: 'test-id',
        object: 'event'
      })
      .end((err, res) => {
        expect(err).to.be.not.null
        expect(res).to.have.status(404)
        expect(res).to.be.json
        expect(res.body.message).to.be.equal('No such event: test-id')
        done()
      })
  })
})
