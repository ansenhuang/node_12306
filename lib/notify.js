const request = require('request');
const nodemailer = require('nodemailer');
const settings = require('../settings.json');

const caches = []; // 消息一条一条地发，以免过于频繁
let isSending = false;

let transporter;
const send_email = 'robot_2019@163.com';
if (settings.receive_email) {
  /* 设置邮箱信息 */
  transporter = nodemailer.createTransport({
    service: '163',
    auth: {
      user: send_email, // 邮箱账号，该邮箱专门用来发邮件
      pass: 'qweasd2019', // 邮箱密码
    }
  });
}

// 发邮件
function sendEmail(options) {
  transporter.sendMail({
    from: send_email,
    to: settings.receive_email,
    subject: options.title,
    html: options.texts.join('<br/>'),
  }, (err, info) => {
    notify(); // 开始下一次发送
    if (err) {
      console.log(err.message);
      return;
    }
    // console.log('邮件发送成功：' + options.title);
  });
}

// 发微信通知
function sendWeChat(options) {
  request({
    method: 'POST',
    uri: 'https://pushbear.ftqq.com/sub',
    formData: {
      sendkey: settings.wx_sendkey,
      text: options.title,
      desp: options.texts.join('\n\n'),
    }
  }, (e, r) => {
    notify();
    if (e) {
      console.log(e.message);
      return;
    }
    // console.log('微信发送成功：' + options.title);
  });
}

function notify(data) {
  if (data) {
    caches.push(data);

    if (isSending) {
      return;
    }
  }

  let options = caches.pop();
  if (!options) {
    isSending = false;
    return;
  }

  isSending = true;

  if (settings.receive_email) {
    sendEmail(options);
  } else if (settings.wx_sendkey) {
    sendWeChat(options);
  }
}

module.exports = notify;
