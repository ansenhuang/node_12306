const fs = require('fs');
const path = require('path');
const prompt = require('inquirer').createPromptModule();
const start = require('../start');
const { formatDate } = require('../utils');
const station = require('../data/station.json');
const info = require('../data/info.json');

module.exports = (oConfig = {}) => {
  prompt([
    {
      type: 'input',
      name: 'date',
      message: `出发日期：`,
      default: oConfig.date || formatDate(),
      validate: input => /[\d]{4}-[\d]{1,2}-[\d]{1,2}/.test(input) ? true : '日期格式错误'
    },
    {
      type: 'input',
      name: 'start_time',
      message: '最早发车时间：',
      default: oConfig.start_time || '00:00',
      validate: input => /[\d]{2}:[\d]{2}/.test(input) ? true : '时间格式错误'
    },
    {
      type: 'input',
      name: 'end_time',
      message: '最晚发车时间：',
      default: oConfig.end_time || '24:00',
      validate: input => /[\d]{2}:[\d]{2}/.test(input) ? true : '时间格式错误'
    },
    {
      type: 'input',
      name: 'start_station_pinyin',
      message: '始发站拼音(如:shanghai)：',
      default: oConfig.start_station_pinyin || undefined,
      validate: input => {
        const info = input && station.stationInfo[input];
        if (info) {
          if (!Array.isArray(info)) {
            console.log(' ' + info.name);
          }
          return true;
        }
        return '该车站不存在';
      }
    },
    {
      type: 'list',
      name: 'start_station_name',
      message: '选择始发站',
      choices: answer => station.stationInfo[answer.start_station].map(item => item.name),
      when: answer => Array.isArray(station.stationInfo[answer.start_station])
    },
    {
      type: 'input',
      name: 'end_station_pinyin',
      message: '终点站拼音(如:beijing)：',
      default: oConfig.end_station_pinyin || undefined,
      validate: input => {
        const info = input && station.stationInfo[input];
        if (info) {
          if (!Array.isArray(info)) {
            console.log(' ' + info.name);
          }
          return true;
        }
        return '该车站不存在';
      }
    },
    {
      type: 'list',
      name: 'end_station_name',
      message: '选择终点站',
      choices: answer => station.stationInfo[answer.end_station].map(item => item.name),
      when: answer => Array.isArray(station.stationInfo[answer.end_station])
    },
    {
      type: 'checkbox',
      name: 'train_types',
      message: '车次类型(可多选)：',
      choices: info.train_types,
      default: oConfig.train_types || [],
      validate: types => types.length > 0 ? true : '至少选中一个车次类型'
    },
    {
      type: 'checkbox',
      name: 'seat_types',
      message: '座位类型(可多选)：',
      choices: info.seat_types,
      default: oConfig.seat_types || [],
      validate: types => types.length > 0 ? true : '至少选中一个座位类型'
    },
    {
      type: 'confirm',
      name: 'student',
      message: '购买学生票?',
      default: oConfig.student || false
    },
  ]).then(answer => {
    const configPath = path.join(__dirname, '../../config');
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath);
    }

    fs.writeFile(
      path.join(configPath, answer.date + '.json'),
      JSON.stringify(answer, null, 2),
      err => {
        if (err) {
          console.log(err.message);
        }
      }
    );

    // 开始查票
    start(answer);
  });
};
