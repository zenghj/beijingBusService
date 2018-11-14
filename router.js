const Router = require('koa-router')
const router = new Router({
  prefix: '/api'
})
const busController = require('./controller/bus')

router.get('/', async (ctx, next) => {
  ctx.body = 'hello beijing bus'
})

router.get('/busList', busController.busList)
router.get('/busDirList', busController.busDirList)
router.get('/busDirStationList', busController.busDirStationList)
router.get('/busTimeInfo', busController.getBusTimeInfo)

module.exports = router

