// 格式化日期
exports.formatDate = (date = new Date()) => {
  const arr =[
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ];
  if (arr[1] < 10) {
    arr[1] = '0' + arr[1];
  }
  if (arr[2] < 10) {
    arr[2] = '0' + arr[2];
  }
  return arr.join('-');
};

exports.logGreen = s => {
  return '\u001b[32m' + s + '\u001b[39m';
};

exports.logHelp = s => {
  return '\u001b[36m' + s + '\u001b[39m';
};
