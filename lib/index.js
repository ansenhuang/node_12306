const prompt = require('inquirer').createPromptModule();

prompt([
  {
    type: 'list',
    name: 'mode',
    message: '选择操作项',
    choices: [
      { name: 'create （新增一个配置并开始抢票）', value: 'create' },
      { name: 'use    （使用已存在的配置开始抢票）', value: 'use' },
      { name: 'update （更新一个已存在的配置并开始抢票）', value: 'update' },
    ],
    default: 'create'
  },
]).then(answer => {
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
