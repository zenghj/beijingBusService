const qs = require('qs');
const request = require('request');
const cheerio = require('cheerio');
const apiBaseUrl = 'http://www.bjbus.com/home/ajax_rtbus_data.php';
const bjbusPageUrl = 'http://www.bjbus.com/home/index.php';
// const cache = {};
// cache.$set = function(key, val) {
//   cache[key] = val;
//   return val;
// };

// cache.$get = function(key) {
//   return cache[key];
// };

function getApiUrl(data) {
  return data ? `${apiBaseUrl}?${qs.stringify(data)}` : apiBaseUrl;
}

const ACTS = {
  getLineDir: 'getLineDir',
  getDirStation: 'getDirStation',
  busTime: 'busTime'
};

const BUS_STATUS = {
  arriving: 'buss',
  onTheWay: 'busc'
};

const MIDDLE_FLAG = 'm';

/**
 * 获取所有北京公交路线
 */
function fetchBusLineList() {
  return new Promise((resolve, reject) => {
    request.get(bjbusPageUrl, (err, res) => {
      if (err) return reject(err);

      let html = res.body;
      let $ = cheerio.load(html);
      let $selBLine = $('#selBLine');
      if ($selBLine) {
        let list = ($selBLine.children('a') || []).map(function(item, i) {
          return $(this).text();
        });

        resolve(Array.from(list));
      } else {
        reject('parse fail');
      }
    });
  });
}

/**
 * 获取具体线路方向
 * @param {*} lineId
 */
function fetchLineDir(lineId) {
  return new Promise((resolve, reject) => {
    if (!lineId) {
      return reject('lineId 不能为空');
    }
    // if (cache.$get(lineId)) {
    //   return resolve(cache.$get(lineId));
    // }
    request.get(
      getApiUrl({
        act: ACTS.getLineDir,
        selBLine: lineId
      }),
      function(err, res) {
        if (err) return reject(err);

        let dataStr = res.body;
        let $ = cheerio.load(dataStr);
        let ret = $('a').map(function(ele, i) {
          return {
            text: $(this).text(),
            id: $(this).attr('data-uuid')
          };
        });

        ret = Array.from(ret);
        // cache.$set(lineId, ret);
        resolve(ret);
      }
    );
  });
}

/**
 * 获取具体线路具体方向的所有站点
 * @param {*} lineId
 * @param {*} dirId
 */
function fetchDirStation(lineId, dirId) {
  return new Promise((resolve, reject) => {
    request.get(
      getApiUrl({
        act: ACTS.getDirStation,
        selBLine: lineId,
        selBDir: dirId
      }),
      function(err, res) {
        if (err) return reject(err);

        let htmlStr = res.body;
        let $ = cheerio.load(htmlStr);
        let ret = $('a').map(function() {
          return {
            seq: $(this).attr('data-seq'),
            text: $(this).text()
          };
        });
        resolve(Array.from(ret));
      }
    );
  });
}

function getMiddleSeq(idStr) {
  let seq = idStr.split(MIDDLE_FLAG)[0];
  return seq ? +seq - 0.5 + '' : '';
}

/**
 * 获取到站时间
 * @param {*} lineId
 * @param {*} dirId
 * @param {*} stopSeq
 */
function fetchBusTime(lineId, dirId, stopSeq) {
  return new Promise((resolve, reject) => {
    request.get(
      getApiUrl({
        act: ACTS.busTime,
        selBLine: lineId,
        selBDir: dirId,
        selBStop: stopSeq
      }),
      (err, res) => {
        if (err) return resolve(err);

        let resBody = res.body;
        let json = {};
        let result = {
          // routeName: '专29路',
          // routeInfo: '地铁上地站-龙域北街东口',
          // desc1: '当代城市家园&nbsp;5:30-23:00&nbsp;分段计价&nbsp;所属客四分公司',
          // desc2: '车辆均已过站', // '最近一辆车距离此还有 1 站， 250 米，预计到站时间 2 分钟'
          // currentStop: {
          //   seq: '5',
          //   text: '当代城市家园'
          // },
          // busesArriving: ['6'], // -1
          // busesOnTheWay: [], // 1
        };
        try {
          json = JSON.parse(resBody);
        } catch (err) {}
        if (json.html) {
          let $ = cheerio.load(json.html);
          let desc1 = $('.inquiry_header article p')
            .first()
            .text();
          let desc2 = $('.inquiry_header article p')
            .eq(1)
            .text();

          // result.originResponse = json.html; // test
          result.routeName = $('#lh').text();
          result.routeInfo = $('#lm').text();
          result.desc1 = desc1;
          result.desc2 = desc2;

          let desc1Splits = desc1.split(' ');
          // result.busRunTime = (desc1.match(/\d{1,2}:\d{1,2}-\d{1,2}:\d{1,2}/) || [])[0]
          result.busRunTime = desc1Splits[1];
          result.curStopName = desc1Splits[0];
          result.curStopSeq = stopSeq;
          result.busCompanyName = desc1Splits[3];
          // result.lastestBus = {
          //   stopCount: result.desc2.match(/(\d+)\s*站/)[1],
          //   distance_meter: result.desc2.match(/(\d+)\s*米/)[1],
          //   time_minute: result.desc2.match(/(\d+)\s*分钟/)[1]
          // }
          result.busesArriving = [];
          result.busesOnTheWay = [];

          let $lis = $('#cc_stop ul li');
          let stopSeqToName = {};
          $lis.each(function(li, i) {
            let $this = $(this);
            let $div = $this.children('div').first();
            let id = $div.attr('id');
            let $i = $div.children('i').first();
            let className = $i.attr('class');
            let isMiddle = id.includes('m'); // <div id="3m"><i></i></div> 表示在站站之间有车
            let stopSeq = isMiddle ? getMiddleSeq(id) : id;
            let stopName = $this.find('span').attr('title');
            if (stopName) {
              stopSeqToName[id] = stopName;
            }

            if (className === BUS_STATUS.arriving) {
              // 到站车辆
              // let clstag = $i.attr('clstag')
              result.busesArriving.push(stopSeq);
            } else if (className === BUS_STATUS.onTheWay) {
              // 途中车辆
              result.busesOnTheWay.push(stopSeq);
            }
          });
          result.stopSeqToName = stopSeqToName;

          resolve(result);
        } else {
          reject(json.err || 'fail');
        }
      }
    );
  });
}

module.exports = {
  fetchLineDir,
  fetchDirStation,
  fetchBusTime,
  fetchBusLineList
};
