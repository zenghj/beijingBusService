const {busList} = require('../data')
const {fetchLineDir, fetchDirStation, fetchBusTime} = require('../api')

exports.busList = async (ctx, next) => {
  ctx.successResponse({
    list: busList
  })
}

exports.busDirList = async (ctx, next) => {
  let query = ctx.query
  let lineId = query.lineId
  if(lineId) {
    try {
      const dirList = await fetchLineDir(lineId)
      ctx.successResponse({
        list: dirList
      })
    } catch(err) {
      ctx.errorResponse({
        error: err,
      })
    }
  } else {
    ctx.errorResponse({
      msg: 'lineId不能为空'
    })
  }
}

exports.busDirStationList = async (ctx, next) => {
  let lineId = ctx.query.lineId
  let dirId = ctx.query.dirId
  if(lineId && dirId) {
    try {
      const list = await fetchDirStation(lineId, dirId);
      ctx.successResponse({
        list,
      })
    } catch (err) {
      ctx.errorResponse({
        error: err,
      })
    }
  } else {
    ctx.errorResponse({
      msg: 'lineId和dirId都不能为空',
    })
  }
}

exports.getBusTimeInfo = async (ctx, next) => {
  let lineId = ctx.query.lineId
  let dirId = ctx.query.dirId
  let stopSeq = ctx.query.stopSeq
  if(lineId && dirId && stopSeq) {
    try {
      const info = await fetchBusTime(lineId, dirId, stopSeq)
      ctx.successResponse({
        info,
      })
    } catch (err) {
      ctx.errorResponse({
        error: err,
      })
    }
  } else {
    ctx.errorResponse({
      msg: 'lineId, dirId, stopSeq 都不能为空'
    })
  }
}