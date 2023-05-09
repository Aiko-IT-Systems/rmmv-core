let cpx = require('@akryum/cpx');
let fs = require('fs');

const root = process.argv[2] || './rmmv-core';
cpx.copySync('./js/main.js', root + '/js');
cpx.copySync('./js/jsconfig.json', root + '/js');
cpx.copySync('./template/**/*', root);
cpx.copySync('./dist/*', root + '/js');
cpx.copySync('./js/libs/*', root + '/js/libs');
cpx.copySync('./plugins/*', root + '/js/plugins');