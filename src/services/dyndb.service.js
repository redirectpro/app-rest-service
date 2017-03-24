import conn from '../connections'
import LoggerHandler from '../handlers/logger.handler'
const logger = LoggerHandler
const path = 'dyndb.service'

export default class DynDBService {
  constructor () {
    this.dyndb = conn.dyndb
  }

  get (table, parameters) {
    const _path = `${path} get:${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        ExpressionAttributeNames: { '#id': 'id' },
        ExpressionAttributeValues: { ':id': parameters.id },
        KeyConditionExpression: '#id = :id',
        scanIndexForward: false,
        Limit: 1
      }

      this.dyndb.query(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  insert (table, parameters) {
    const _path = `${path} insert:${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const item = parameters
      item.created = Date.now()
      item.updated = Date.now()

      const queryParams = {
        TableName: `rp_${table}`,
        Item: item
      }

      this.dyndb.put(queryParams, (err, data) => {
        if (err) reject(err)
        resolve(item)
      })
    })
  }

  delete (table, id) {
    const _path = `${path} insert:${table}`
    logger.info(`${_path} ${id}`)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id }
      }

      this.dyndb.delete(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  getByUserId (table, parameters) {
    const _path = `${path} ${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        // ProjectionExpression: 'id',
        FilterExpression: 'contains(#field,:value)',
        ExpressionAttributeNames: {
          '#field': 'users'
        },
        ExpressionAttributeValues: {
          ':value': parameters.id
        },
        Limit: 10
      }

      this.dyndb.scan(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  listAppend (table, id, attribute, values) {
    const _path = `${path} ${table}:${attribute}`
    logger.info(`${_path}`, values)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id },
        UpdateExpression: 'SET #field = list_append(:attrValue, #field)',
        ExpressionAttributeValues: {
          ':attrValue': values
        },
        ExpressionAttributeNames: {
          '#field': attribute
        }
      }

      this.dyndb.update(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  listRemoveByIndex (table, id, attribute, indexes) {
    const _path = `${path} ${table}:${attribute}`
    logger.info(`${_path}`, indexes)

    return new Promise((resolve, reject) => {
      let conditions = []
      for (let index in indexes) {
        conditions.push(`#field[${indexes[index]}]`)
      }

      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id },
        UpdateExpression: 'REMOVE ' + conditions.join(', '),
        ExpressionAttributeNames: {
          '#field': attribute
        }
      }

      this.dyndb.update(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }
}
