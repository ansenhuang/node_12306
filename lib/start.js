const request = require('request');
const schedule = require('node-schedule');
const notify = require('./notify');
const { logGreen, logHelp } = require('./utils');
const station = require('./data/station.json');
const info = require('./data/info.json');

function formatData(arr, map) {
  const result = [];

  arr.forEach(item => {
    const cq = item.split('|');
    const cu = {};

    cu.secretHBStr = cq[36];
    cu.secretStr = cq[0];
    cu.buttonTextInfo = cq[1];
    cu.train_no = cq[2];
    cu.station_train_code = cq[3];
    cu.start_station_telecode = cq[4];
    cu.end_station_telecode = cq[5];
    cu.from_station_telecode = cq[6];
    cu.to_station_telecode = cq[7];
    cu.start_time = cq[8];
    cu.arrive_time = cq[9];
    cu.lishi = cq[10];
    cu.canWebBuy = cq[11];
    cu.yp_info = cq[12];
    cu.start_train_date = cq[13];
    cu.train_seat_feature = cq[14];
    cu.location_code = cq[15];
    cu.from_station_no = cq[16];
    cu.to_station_no = cq[17];
    cu.is_support_card = cq[18];
    cu.controlled_train_flag = cq[19];

    cu.seat = {};
    cu.seat.gg = cq[20] || '无';
    // 高级软卧
    cu.seat.gr = cq[21] || '无';
    // 其他
    cu.seat.qt = cq[22] || '无';
    // 软卧
    cu.seat.rw = cq[23] || '无';
    // 软座
    cu.seat.rz = cq[24] || '无';
    cu.seat.tz = cq[25] || '无';
    // 无座
    cu.seat.wz = cq[26] || '无';
    cu.seat.yb = cq[27] || '无';
    // 硬卧
    cu.seat.yw = cq[28] || '无';
    // 硬座
    cu.seat.yz = cq[29] || '无';
    // 二等座
    cu.seat.ze = cq[30] || '无';
    // 一等座
    cu.seat.zy = cq[31] || '无';
    // 商务座
    cu.seat.swz = cq[32] || '无';
    // 动卧
    cu.seat.srrb = cq[33] || '无';

    cu.yp_ex = cq[34];
    cu.seat_types = cq[35];
    cu.exchange_train_flag = cq[36];
    cu.from_station_name = map[cq[6]];
    cu.to_station_name = map[cq[7]];

    result.push(cu);
  });

  return result;
}

/*
* 查询余票
*/
const ticket_cache = {}; // 缓存已查到的票，若没有更新则不再发送通知
function queryTickets(config) {
  let start_station_info = station.stationInfo[config.start_station_pinyin];
  let end_station_info = station.stationInfo[config.end_station_pinyin];
  if (config.start_station_name) {
    start_station_info = start_station_info.find(item => item.name === config.start_station_name);
  }
  if (config.end_station_name) {
    end_station_info = end_station_info.find(item => item.name === config.end_station_name);
  }

  let pagelink = encodeURI(
    'https://kyfw.12306.cn/otn/leftTicket/init?' + [
      'linktypeid=dc',
      'fs=' + start_station_info.name + ',' + start_station_info.code,
      'ts=' + end_station_info.name + ',' + end_station_info.code,
      'date=' + config.date,
      'flag=N,Y,Y',
    ].join('&')
  );
  console.log(logHelp('查询链接：' + pagelink));
  console.log('---------查询开始---------');
  /* 请求开始 */
  request({
    method: 'GET',
    uri: 'https://kyfw.12306.cn/otn/leftTicket/queryZ?' + [
      'leftTicketDTO.train_date=' + config.date,
      'leftTicketDTO.from_station=' + start_station_info.code,
      'leftTicketDTO.to_station=' + end_station_info.code,
      'purpose_codes=' + (config.student ? '0X00' : 'ADULT'),
    ].join('&'),
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Host': 'kyfw.12306.cn',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36',
    },
  }, (e, r) => {
    if (e) {
      console.log(e.message);
      return;
    }

    let trainArr = [];
    let trainMap = {};
    try {
      let data = JSON.parse(r.body).data;
      trainArr = data && data.result;
      trainMap = data && data.map;
    } catch (e) {
      console.log('JSON解析出错：', e.message);
      return;
    }

    if (trainArr.length === 0) {
      console.log('没有查询到列车信息');
      return;
    }

    let formatResult = formatData(trainArr, trainMap);
    formatResult.forEach(item => {
      // 根据时间筛选
      if (
        item.start_time < config.start_time ||
        item.start_time > config.end_time
      ) {
        return;
      }

      // 根据车次筛选
      let trainType = item.station_train_code.replace(/\d/g, '') || '-';
      let trainTypeIndex = config.train_types.join(',').split(',').indexOf(trainType);
      if (trainTypeIndex === -1) {
        return;
      }

      // 根据座位筛选
      let hasSeatInfo = {};
      Object.keys(item.seat).filter(key => {
        let seat = item.seat[key];
        if (
          seat !== '无' &&
          config.seat_types.indexOf(key) !== -1
        ) {
          hasSeatInfo[key] = seat;
        }
      });
      if (Object.keys(hasSeatInfo).length === 0) {
        return;
      }

      if (
        JSON.stringify(ticket_cache[item.station_train_code]) === JSON.stringify(hasSeatInfo)
      ) {
        // 前后查询结果相同，不再提醒
        return;
      }
      ticket_cache[item.station_train_code] = hasSeatInfo;

      let carInfo = `${item.station_train_code} ${item.from_station_name}-${item.to_station_name}`;
      let startTime = `${item.start_train_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')} ${item.start_time}`;
      let subject = '票子来啦 => ' + carInfo + ' ' + startTime;
      console.log(logGreen(subject));

      // 发送通知
      notify({
        title: subject,
        texts: [
          '小主，已经帮你查到票啦！',
          '====================',
          carInfo,
          '发车时间：' + startTime,
          `预计到达时间：${item.arrive_time}（历时 ${item.lishi}）`,
          Object.keys(hasSeatInfo).map(key => {
            let seat = info.seat_types.find(seat => seat.value === key);
            return `${seat.name}：${hasSeatInfo[key]}`;
          }).join('，'),
          `查询链接：<a href="${pagelink}">${pagelink}</a>`,
        ],
      });
    });
  });
}

module.exports = config => {
  queryTickets(config);

  const rule = new schedule.RecurrenceRule();
  rule.second = [0];
  schedule.scheduleJob(rule, () => {
    queryTickets(config);
  });
}
