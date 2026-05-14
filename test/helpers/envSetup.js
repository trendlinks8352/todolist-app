'use strict';

const path = require('path');

// .env.test를 우선 로드 (override: true로 기존 env 덮어쓰기)
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: true,
});

// .env는 누락된 변수(POSTGRES_CONNECTION_STRING 등) 보충
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});
