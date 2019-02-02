const fs = require('fs');
const path = require('path');
const prompt = require('inquirer').createPromptModule();

const settingsPath = path.join(__dirname, '../settings.json');
const questions = [];

if (!fs.existsSync(settingsPath)) {
  questions.push({
    type: 'list',
    name: 'notify_type',
    message: '选择通知方式(接收抢票信息)：',
    choices: [
      { name: '邮箱通知', value: 'email' },
      { name: '微信通知', value: 'wx' },
    ]
  }, {
    type: 'input',
    name: 'receive_email',
    message: '收件人邮箱：',
    validate: input => /\w+@\w+(\.\w+)+/.test(input) ? true : '邮箱格式错误',
    when: answer => answer.notify_type === 'email',
  }, {
    type: 'input',
    name: 'wx_sendkey',
    message: 'SendKey（没有的话在这里申请 https://pushbear.ftqq.com）：',
    validate: input => input ? true : '请输入SendKey',
    when: answer => answer.notify_type === 'wx',
  });
}

questions.push({
  type: 'list',
  name: 'mode',
  message: '选择操作项',
  choices: [
    { name: 'create （新增一个配置并开始抢票）', value: 'create' },
    { name: 'use    （使用已存在的配置开始抢票）', value: 'use' },
    { name: 'update （更新一个已存在的配置并开始抢票）', value: 'update' },
  ]
});

prompt(questions).then(answer => {
  if (answer.notify_type) {
    // 写入文件，下次就不用再输入啦
    fs.writeFileSync(settingsPath, JSON.stringify({
      receive_email: answer.receive_email,
      wx_sendkey: answer.wx_sendkey,
    }, null, 2));
  }

  // 开始执行
  switch (answer.mode) {
    case 'use':
    case 'update':
      require('./mode/use')(answer.mode);
      break;
    case 'create':
      require('./mode/update')();
      break;
    default:
      // nothing
  }
});
