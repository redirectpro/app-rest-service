import Promise from 'es6-promise'
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

      this.dyndb.put(queryParams, (err) => {
        if (err) reject(err)
        resolve(item)
      })
    })
  }

  delete (table, id) {
    const _path = `${path} delete:${table} ${id}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id }
      }

      this.dyndb.delete(queryParams, (err, data) => {
        if (err) {
          logger.error(`${_path} error`)
          return reject(err)
        }

        logger.info(`${_path} success`)
        return resolve(data)
      })
    })
  }

  update (table, id, parameters) {
    const _path = `${path} update:${table} ${id}`
    logger.info(`${_path}`)

    return new Promise((resolve, reject) => {
      const item = parameters
      item.updated = Date.now()
      let conditions = []
      let expValues = {}
      let expNames = {}

      for (let key in item) {
        conditions.push(`#${key} = :${key}`)
        expNames[`#${key}`] = key
        expValues[`:${key}`] = item[key]
      }

      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id },
        UpdateExpression: 'SET ' + conditions.join(', '),
        ExpressionAttributeNames: expNames,
        ExpressionAttributeValues: expValues,
        ReturnValues: 'UPDATED_NEW'
      }

      this.dyndb.update(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data.Attributes)
      })
    })
  }

  getByUserId (table, parameters) {
    const _path = `${path} getByUserId ${table}`
    logger.info(`${_path}`, parameters)

    return new Promise((resolve, reject) => {
      let queryParams = {
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

      if (parameters.applicationId) {
        queryParams.ExpressionAttributeNames['#id'] = 'id'
        queryParams.ExpressionAttributeValues[':id'] = parameters.applicationId
        queryParams.FilterExpression += ' and #id = :id'
      }

      this.dyndb.scan(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  listAppend (table, id, attribute, values) {
    const _path = `${path} listAppend ${table}:${attribute}`
    logger.info(`${_path}`, values)

    return new Promise((resolve, reject) => {
      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id },
        UpdateExpression: 'SET #field = list_append(:attrValue, #field), #upd = :upd',
        ExpressionAttributeValues: {
          ':attrValue': values,
          ':upd': Date.now()
        },
        ExpressionAttributeNames: {
          '#field': attribute,
          '#upd': 'updated'
        }
      }

      this.dyndb.update(queryParams, (err, data) => {
        if (err) return reject(err)
        return resolve(data)
      })
    })
  }

  listRemoveByIndex (table, id, attribute, indexes) {
    const _path = `${path} listRemoveByIndex ${table}:${attribute}`
    logger.info(`${_path}`, indexes)

    return new Promise((resolve, reject) => {
      let conditions = []
      for (let index in indexes) {
        conditions.push(`#field[${indexes[index]}]`)
      }

      const queryParams = {
        TableName: `rp_${table}`,
        Key: { 'id': id },
        UpdateExpression: 'REMOVE ' + conditions.join(', ') + ' SET #upd = :upd',
        ExpressionAttributeValues: {
          ':upd': Date.now()
        },
        ExpressionAttributeNames: {
          '#field': attribute,
          '#upd': 'updated'
        }
      }

      logger.debug(queryParams)

      this.dyndb.update(queryParams, (err, data) => {
        if (err) {
          logger.error(`${_path} error`)
          return reject(err)
        }

        logger.info(`${_path} success`)
        return resolve(data)
      })
    })
  }
}
