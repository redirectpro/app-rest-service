import conn from '../connections'
import LoggerHandler from '../handlers/logger.handler'
const logger = LoggerHandler
const path = 'dyndb.service'

export default class DynDBService {

  static getUser (parameters) {
    const _path = `${path} getUser`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: 'rp_user',
        ExpressionAttributeNames: { '#id': 'id' },
        ExpressionAttributeValues: { ':id': parameters.id },
        KeyConditionExpression: '#id = :id',
        scanIndexForward: false,
        Limit: 1
      }

      conn.dyndb.query(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  static getApplicationByUserId (parameters) {
    const _path = `${path} getApplicationByUserId`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: 'rp_application',
        ProjectionExpression: 'id',
        FilterExpression: 'contains(#field,:value)',
        ExpressionAttributeNames: {
          '#field': 'users'
        },
        ExpressionAttributeValues: {
          ':value': parameters.id
        },
        Limit: 10
      }

      conn.dyndb.scan(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  static insertUser (parameters) {
    const _path = `${path} insertUser`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const item = {
        id: parameters.id,
        created: Date.now(),
        updated: Date.now()
      }

      const params = {
        TableName: 'rp_user',
        Item: item
      }

      conn.dyndb.put(params, (err, data) => {
        if (err) reject(err)
        resolve(item)
      })
    })
  }

  static insertApplication (parameters) {
    const _path = `${path} insertApplication`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const item = parameters
      item.created = Date.now()
      item.updated = Date.now()

      const params = {
        TableName: 'rp_application',
        Item: item
      }

      conn.dyndb.put(params, (err, data) => {
        if (err) reject(err)
        resolve(item)
      })
    })
  }

}
