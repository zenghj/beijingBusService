const path = require('path')
const buslinesJSON = require('./buslinesJSON.json')
const {fetchBusLineList} = require('../api')
const {fsPromises} = require('../utils')

let busList = buslinesJSON
function initData() {
  fetchBusLineList()
    .then(list => {
      if(Array.isArray(list) && list.length > 0) {
        busList = list;
        fsPromises
          .writeFile(path.resolve(__dirname, './buslinesJSON.json'), JSON.stringify(busList, null, 4))
          .then(() => {
            console.log('write buslinesJSON.json success', new Date().toDateString())
          })
          .catch(err => {
            console.error('failt to write buslinesJSON.json')
          })
      }
    }).catch(err => {
      console.error(err);
    })
}

initData()

module.exports = {
  busList
}
