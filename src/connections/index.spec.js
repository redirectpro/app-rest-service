import chai from 'chai'
import conn from './index'

const expect = chai.expect

describe('./connections/index', () => {
  it('conn.stripe should return an object', (done) => {
    expect(conn.stripe).to.be.an('object')
    done()
  })
})
