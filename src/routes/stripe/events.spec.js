import chai from 'chai'
import chaiHttp from 'chai-http'
import app from '../../test/app'
import TestUtils from '../../test/utils'
import ApplicatinService from '../../services/application.service'
const expect = chai.expect

chai.use(chaiHttp)

describe('./stripe/events', () => {
  const applicationService = new ApplicatinService()
  const userId = 'testStripeEventsSpecId'
  const testUtils = new TestUtils()
  const accessToken = testUtils.genAccessToken({
    'email': `${userId}@redirectpro.io`,
    'sub': `auth0|${userId}`
  })

  // let applicationId

  before((done) => {
    applicationService.user.getApplications(userId).then((items) => {
      let promises = []

      for (let item of items) {
        let p1 = applicationService.delete(item.applicationId)
        let p2 = applicationService.user.delete(item.userId)
        promises.push(p1)
        promises.push(p2)
      }

      return Promise.all(promises)
    }).then(() => {
      done()
    }).catch((err) => {
      done(err)
    })
  })

  it('first access on /v1/user/profile to create application', (done) => {
    chai.request(app)
      .get('/v1/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .end((err, res) => {
        expect(err).to.be.null
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body.applications).to.be.instanceof(Array)
        // applicationId = res.body.applications[0].id
        done()
      })
  })

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

  // it.only('should test middleware', (done) => {
  //   // const validateStripeEvent = events.validateStripeEvent
  //   // done()
  //   const testSinon = sinon.stub(events, 'validateStripeEvent')
  //   testSinon.callsArg(3)
  //
  //   chai.request(app)
  //     .post('/stripe/events')
  //     .send({
  //       id: 'test-id',
  //       object: 'event'
  //     })
  //     .end((err, res) => {
  //       console.log(res.body)
  //       expect(err).to.be.not.null
  //       expect(res).to.have.status(404)
  //       expect(res).to.be.json
  //       expect(res.body.message).to.be.equal('No such event: test-id')
  //       done()
  //     })
  // })
})
