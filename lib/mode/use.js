const fs = require('fs');
const path = require('path');
const prompt = require('inquirer').createPromptModule();

const configPath = path.join(__dirname, '../../config');

module.exports = (mode) => {
  fs.readdir(configPath, (err, files) => {
    if (err) {
      console.log(err.message);
      return;
    }

    const configFiles = files.filter(file => {
      const stat = fs.statSync(path.join(configPath, file));
      return !stat.isDirectory();
    });

    if (configFiles.length === 0) {
      console.log('没有已存在的配置，请新增一个配置');
      require('./create');
      return;
    }

    prompt([
      {
        type: 'list',
        name: 'file',
        message: '选择一个配置',
        choices: configFiles
      },
    ]).then(answer => {
      const config = require(path.join(configPath, answer.file));
      if (mode === 'use') {
        require('../start')(config);
      } else {
        require('./update')(config);
      }
    });
  });
};
