'use strict';

// ------------------------------------------------------------------ //
// pg 모듈 전체를 모킹한다.
// Pool 인스턴스 메서드(query, connect, on, release)를 jest.fn()으로 대체해
// 실제 DB 연결 없이 pool.js 로직을 검증한다.
// ------------------------------------------------------------------ //

// 모킹된 클라이언트 팩토리 — 각 테스트에서 동작을 개별 설정할 수 있도록
// 모듈 스코프에서 변수로 선언한 뒤 beforeEach 에서 초기화한다.
let mockClient;
let MockPool;

jest.mock('pg', () => {
  // jest.mock 팩토리는 호이스팅되므로 외부 변수에 직접 접근할 수 없다.
  // 대신 생성자 내부에서 전역 __mockPoolInstance 를 설정하는 방식을 사용한다.
  const EventEmitter = require('events');

  class FakePool extends EventEmitter {
    constructor(config) {
      super();
      FakePool.__lastConfig = config;
      FakePool.__instance = this;
      // connect() 는 각 테스트에서 mockResolvedValue 로 재정의한다.
      this.connect = jest.fn();
    }
  }

  return { Pool: FakePool };
});

// src/config/database.js 는 require 시점에 환경변수를 검사하고
// process.exit(1) 을 호출할 수 있으므로 완전히 모킹해 부작용을 차단한다.
jest.mock('../../src/config/database', () => ({
  connectionString: 'postgresql://mock-host/mock-db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}));

describe('db/pool', () => {
  // pool.js 는 모듈 최상위에서 new Pool() 을 실행하므로
  // 모킹 설정이 완료된 뒤 한 번만 require 한다.
  const { Pool } = require('pg');
  const { pool, withTransaction } = require('../../src/db/pool');

  beforeEach(() => {
    // 매 테스트마다 깨끗한 클라이언트 mock 을 생성한다.
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    // 기본값: connect() 는 mockClient 를 반환한다.
    Pool.__instance.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------- //
  // Pool 인스턴스 생성 검증
  // ---------------------------------------------------------------- //
  describe('Pool 인스턴스 초기화', () => {
    it('모킹된 Pool 생성자로 pool 인스턴스가 생성된다', () => {
      expect(pool).toBeInstanceOf(Pool);
    });

    it('database config 의 값이 Pool 생성자에 그대로 전달된다', () => {
      const config = Pool.__lastConfig;
      expect(config.connectionString).toBe('postgresql://mock-host/mock-db');
      expect(config.max).toBe(10);
      expect(config.idleTimeoutMillis).toBe(30000);
      expect(config.connectionTimeoutMillis).toBe(2000);
    });

    it("pool 에 'error' 이벤트 핸들러가 등록된다", () => {
      // EventEmitter.listenerCount 로 핸들러 등록 여부를 확인한다.
      const count = pool.listenerCount('error');
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("'error' 이벤트 핸들러가 console.error 를 호출한다", () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      pool.emit('error', { message: '테스트 오류' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[DB Pool] 유휴 클라이언트 오류:',
        '테스트 오류'
      );
      consoleSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------- //
  // withTransaction — 성공 시나리오
  // ---------------------------------------------------------------- //
  describe('withTransaction — 성공 경로', () => {
    it('BEGIN 후 콜백을 실행하고 COMMIT 을 호출한다', async () => {
      mockClient.query.mockResolvedValue({});
      const callback = jest.fn().mockResolvedValue('result-value');

      await withTransaction(callback);

      const calls = mockClient.query.mock.calls.map((c) => c[0]);
      expect(calls[0]).toBe('BEGIN');
      expect(calls[1]).toBe('COMMIT');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(mockClient);
    });

    it('콜백의 반환값을 그대로 반환한다', async () => {
      mockClient.query.mockResolvedValue({});
      const expected = { id: 42, title: '테스트 할일' };
      const callback = jest.fn().mockResolvedValue(expected);

      const result = await withTransaction(callback);

      expect(result).toEqual(expected);
    });

    it('성공 후 ROLLBACK 을 호출하지 않는다', async () => {
      mockClient.query.mockResolvedValue({});
      const callback = jest.fn().mockResolvedValue(null);

      await withTransaction(callback);

      const calls = mockClient.query.mock.calls.map((c) => c[0]);
      expect(calls).not.toContain('ROLLBACK');
    });

    it('성공 후 client.release() 를 반드시 호출한다', async () => {
      mockClient.query.mockResolvedValue({});
      const callback = jest.fn().mockResolvedValue(null);

      await withTransaction(callback);

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------- //
  // withTransaction — 실패 시나리오
  // ---------------------------------------------------------------- //
  describe('withTransaction — 실패 경로', () => {
    it('콜백이 throw 하면 ROLLBACK 을 호출한다', async () => {
      mockClient.query.mockResolvedValue({});
      const error = new Error('콜백 오류');
      const callback = jest.fn().mockRejectedValue(error);

      await expect(withTransaction(callback)).rejects.toThrow('콜백 오류');

      const calls = mockClient.query.mock.calls.map((c) => c[0]);
      expect(calls).toContain('ROLLBACK');
    });

    it('콜백이 throw 해도 COMMIT 을 호출하지 않는다', async () => {
      mockClient.query.mockResolvedValue({});
      const callback = jest.fn().mockRejectedValue(new Error('오류'));

      await expect(withTransaction(callback)).rejects.toThrow();

      const calls = mockClient.query.mock.calls.map((c) => c[0]);
      expect(calls).not.toContain('COMMIT');
    });

    it('콜백이 throw 하면 원래 에러를 다시 던진다', async () => {
      mockClient.query.mockResolvedValue({});
      const originalError = new Error('원본 오류');
      const callback = jest.fn().mockRejectedValue(originalError);

      const thrown = await withTransaction(callback).catch((e) => e);

      expect(thrown).toBe(originalError);
    });

    it('실패 후에도 client.release() 를 반드시 호출한다 (finally 보장)', async () => {
      mockClient.query.mockResolvedValue({});
      const callback = jest.fn().mockRejectedValue(new Error('오류'));

      await expect(withTransaction(callback)).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('ROLLBACK 자체가 실패해도 에러를 전파하고 release 를 호출한다', async () => {
      // BEGIN 은 성공, COMMIT/ROLLBACK 은 실패 시뮬레이션
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('ROLLBACK 실패')); // ROLLBACK

      const callback = jest.fn().mockRejectedValue(new Error('콜백 오류'));

      await expect(withTransaction(callback)).rejects.toThrow();
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------- //
  // withTransaction — pool.connect() 실패
  // ---------------------------------------------------------------- //
  describe('withTransaction — 연결 획득 실패', () => {
    it('pool.connect() 가 reject 하면 에러를 전파한다', async () => {
      Pool.__instance.connect.mockRejectedValue(new Error('연결 실패'));

      await expect(
        withTransaction(jest.fn())
      ).rejects.toThrow('연결 실패');
    });
  });
});
