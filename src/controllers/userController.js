'use strict';

const userService = require('../services/userService');
const { HTTP_STATUS } = require('../constants/constants');

async function getMe(req, res, next) {
  try {
    const user = await userService.getMe(req.user.id);
    console.log(`[User] getMe 성공 - userId: ${req.user.id}`);
    res.status(HTTP_STATUS.OK).json(user);
  } catch (err) {
    next(err);
  }
}

async function updatePreferences(req, res, next) {
  try {
    console.log(`[User] 설정 업데이트 요청 - userId: ${req.user.id}, body:`, req.body);
    const result = await userService.updatePreferences(req.user.id, req.body);
    console.log(`[User] 설정 업데이트 성공 - userId: ${req.user.id}, theme: ${result.theme}`);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    await userService.deleteMe(req.user.id);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updatePreferences, deleteMe };
