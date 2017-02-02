import chai from 'chai'
import conn from './index'

const expect = chai.expect

describe('./connections/index', () => {
  it('conn.stripe should return an object', (done) => {
    expect(conn.stripe).to.be.an('object')
    done()
  })
  it('conn.authClient should return an object', (done) => {
    expect(conn.authClient).to.be.an('object')
    done()
  })
  it('conn.authManage should return an object', (done) => {
    expect(conn.authManage).to.be.an('object')
    done()
  })
})
