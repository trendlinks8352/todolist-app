'use strict';

// ------------------------------------------------------------------ //
// dateUtils 는 외부 의존성이 없는 순수 함수이므로 jest.mock 이 불필요하다.
// 테스트의 결정론적 실행을 위해 "오늘" 기준 날짜를 고정된 값으로 설정한다.
//
// 전략: jest.spyOn(global, 'Date') 로 Date 생성자를 가로채되,
//   - 인수 없이 호출되면(new Date()) → 고정된 "오늘" 날짜를 반환
//   - 인수가 있으면(new Date(dateStr)) → 실제 Date 동작을 유지
// 이렇게 하면 isDateTodayOrFuture 내부의 new Date() 와 new Date(dateStr) 를
// 모두 올바르게 처리할 수 있다.
//
// 고정 "오늘": 2025-06-15 (UTC 기준 자정)
// ------------------------------------------------------------------ //

const { isDateTodayOrFuture } = require('../../src/utils/dateUtils');

describe('dateUtils', () => {
  describe('isDateTodayOrFuture', () => {
    // 고정 오늘 날짜: 2025-06-15
    const FIXED_TODAY = new Date('2025-06-15T00:00:00.000Z');
    let OriginalDate;
    let dateSpy;

    beforeEach(() => {
      OriginalDate = global.Date;

      // Date 생성자를 래핑한다.
      // new Date()         → 고정 오늘(FIXED_TODAY 복사본)을 반환
      // new Date(arg)      → 실제 Date 동작 유지
      function MockDate(...args) {
        if (args.length === 0) {
          // 인수 없으면 고정 오늘 반환
          return new OriginalDate('2025-06-15T00:00:00.000Z');
        }
        return new OriginalDate(...args);
      }

      // 정적 메서드들을 원본에서 복사한다.
      Object.setPrototypeOf(MockDate, OriginalDate);
      MockDate.now = () => FIXED_TODAY.getTime();
      MockDate.UTC = OriginalDate.UTC;
      MockDate.parse = OriginalDate.parse;
      MockDate.prototype = OriginalDate.prototype;

      dateSpy = jest.spyOn(global, 'Date').mockImplementation(MockDate);
    });

    afterEach(() => {
      dateSpy.mockRestore();
    });

    // ------------------------------------------------------------ //
    // 오늘 / 미래 → true
    // ------------------------------------------------------------ //
    it('오늘 날짜("2025-06-15")를 전달하면 true 를 반환한다', () => {
      expect(isDateTodayOrFuture('2025-06-15')).toBe(true);
    });

    it('내일 날짜("2025-06-16")를 전달하면 true 를 반환한다', () => {
      expect(isDateTodayOrFuture('2025-06-16')).toBe(true);
    });

    it('1년 후 날짜("2026-06-15")를 전달하면 true 를 반환한다', () => {
      expect(isDateTodayOrFuture('2026-06-15')).toBe(true);
    });

    it('먼 미래 날짜("2030-12-31")를 전달하면 true 를 반환한다', () => {
      expect(isDateTodayOrFuture('2030-12-31')).toBe(true);
    });

    // ------------------------------------------------------------ //
    // 어제 / 과거 → false
    // ------------------------------------------------------------ //
    it('어제 날짜("2025-06-14")를 전달하면 false 를 반환한다', () => {
      expect(isDateTodayOrFuture('2025-06-14')).toBe(false);
    });

    it('1달 전 날짜("2025-05-15")를 전달하면 false 를 반환한다', () => {
      expect(isDateTodayOrFuture('2025-05-15')).toBe(false);
    });

    it('과거 날짜("2020-01-01")를 전달하면 false 를 반환한다', () => {
      expect(isDateTodayOrFuture('2020-01-01')).toBe(false);
    });

    // ------------------------------------------------------------ //
    // 반환 타입
    // ------------------------------------------------------------ //
    it('반환값이 boolean 타입이다 (미래)', () => {
      const result = isDateTodayOrFuture('2026-01-01');
      expect(typeof result).toBe('boolean');
    });

    it('반환값이 boolean 타입이다 (과거)', () => {
      const result = isDateTodayOrFuture('2024-01-01');
      expect(typeof result).toBe('boolean');
    });
  });
});
