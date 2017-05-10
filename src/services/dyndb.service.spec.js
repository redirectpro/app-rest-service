import Promise from 'es6-promise'
import chai from 'chai'
import sinon from 'sinon'
import aws from 'aws-sdk'
import DynDBService from './dyndb.service'

const assert = chai.assert
const expect = chai.expect

describe('./services/dyndb.service', () => {
  const dyndbService = new DynDBService({})

  let stubAwsDynDBGet; let stubAwsDynDBQuery
  let stubAwsDynDBPut; let stubAwsDynDBDelete
  let stubAwsDynDBUpdate

  before(() => {
    sinon.stub(Date, 'now').returns(1400000000000)
    stubAwsDynDBGet = sinon.stub(aws.DynamoDB.DocumentClient.prototype, 'get')
    stubAwsDynDBQuery = sinon.stub(aws.DynamoDB.DocumentClient.prototype, 'query')
    stubAwsDynDBPut = sinon.stub(aws.DynamoDB.DocumentClient.prototype, 'put')
    stubAwsDynDBDelete = sinon.stub(aws.DynamoDB.DocumentClient.prototype, 'delete')
    stubAwsDynDBUpdate = sinon.stub(aws.DynamoDB.DocumentClient.prototype, 'update')
  })

  after(() => {
    Date.now.restore()
    aws.DynamoDB.DocumentClient.prototype.get.restore()
    aws.DynamoDB.DocumentClient.prototype.query.restore()
    aws.DynamoDB.DocumentClient.prototype.put.restore()
    aws.DynamoDB.DocumentClient.prototype.delete.restore()
    aws.DynamoDB.DocumentClient.prototype.update.restore()
  })

  describe('get', () => {
    it('success', (done) => {
      stubAwsDynDBGet.callsFake(() => {
        return {
          promise: () => {
            return new Promise((resolve) => {
              return resolve({
                content: 'OK'
              })
            })
          }
        }
      })

      dyndbService.get({
        table: 'tmp',
        keys: {
          id: 'id'
        }
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubAwsDynDBGet.callsFake(() => {
        return {
          promise: () => {
            return Promise.reject({
              name: 'NAME',
              message: 'message'
            })
          }
        }
      })

      dyndbService.get({
        table: 'tmp',
        keys: {
          id: 'id'
        }
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('query', () => {
    it('success', (done) => {
      stubAwsDynDBQuery.callsFake(() => {
        return {
          promise: () => {
            return new Promise((resolve) => {
              return resolve([
                { content: 'OK' }
              ])
            })
          }
        }
      })

      dyndbService.query({
        table: 'tmp',
        keys: {
          id: 'id'
        }
      }).then((item) => {
        expect(item).to.be.an('array')
        assert.equal(item[0].content, 'OK')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubAwsDynDBQuery.callsFake(() => {
        return {
          promise: () => {
            return Promise.reject({
              name: 'NAME',
              message: 'message'
            })
          }
        }
      })

      dyndbService.query({
        table: 'tmp',
        keys: {
          id: 'id'
        }
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('insert', () => {
    it('success', (done) => {
      stubAwsDynDBPut.callsFake(() => {
        return {
          promise: () => {
            return new Promise((resolve) => {
              return resolve()
            })
          }
        }
      })

      dyndbService.insert({
        table: 'tmp',
        keys: {
          id: 'id'
        },
        item: {
          content: 'OK'
        }
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item.content, 'OK')
        assert.equal(item.createdAt, 1400000000000)
        assert.equal(item.updatedAt, 1400000000000)
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubAwsDynDBPut.callsFake(() => {
        return {
          promise: () => {
            return Promise.reject({
              name: 'NAME',
              message: 'message'
            })
          }
        }
      })

      dyndbService.insert({
        table: 'tmp',
        keys: {
          id: 'id'
        },
        item: {
          content: 'OK'
        }
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('delete', () => {
    it('success', (done) => {
      stubAwsDynDBDelete.callsFake(() => {
        return {
          promise: () => {
            return new Promise((resolve) => {
              return resolve({})
            })
          }
        }
      })

      dyndbService.delete({
        table: 'tmp',
        keys: {
          id: 'id'
        }
      }).then((item) => {
        expect(item).to.be.an('object')
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubAwsDynDBDelete.callsFake(() => {
        return {
          promise: () => {
            return Promise.reject({
              name: 'NAME',
              message: 'message'
            })
          }
        }
      })

      dyndbService.delete({
        table: 'tmp',
        keys: {
          id: 'id'
        }
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })

  describe('update', () => {
    it('success', (done) => {
      stubAwsDynDBUpdate.callsFake((params) => {
        return {
          promise: () => {
            return new Promise((resolve) => {
              return resolve({
                Attributes: params.ExpressionAttributeValues
              })
            })
          }
        }
      })

      dyndbService.update({
        table: 'tmp',
        keys: {
          id: 'id',
          applicationId: 'app-id'
        },
        item: {
          content: 'OK'
        }
      }).then((item) => {
        expect(item).to.be.an('object')
        assert.equal(item[':content'], 'OK')
        assert.equal(item[':updatedAt'], 1400000000000)
        done()
      }).catch(err => done(err))
    })

    it('should return error', (done) => {
      stubAwsDynDBUpdate.callsFake(() => {
        return {
          promise: () => {
            return Promise.reject({
              name: 'NAME',
              message: 'message'
            })
          }
        }
      })

      dyndbService.update({
        table: 'tmp',
        keys: {
          id: 'id',
          applicationId: 'app-id'
        },
        item: {
          content: 'OK'
        }
      }).catch((err) => {
        assert.equal(err.name, 'NAME')
        assert.equal(err.message, 'message')
        done()
      }).catch(err => done(err))
    })
  })
})
