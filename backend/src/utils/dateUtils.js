'use strict';

function isDateTodayOrFuture(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target >= today;
}

module.exports = { isDateTodayOrFuture };
