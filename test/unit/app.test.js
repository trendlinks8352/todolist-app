'use strict';

const request = require('supertest');
const app = require('../../src/app');

// ------------------------------------------------------------------ //
// app.js 는 DB/pool 을 require 하지 않으므로 별도 DB 모킹 불필요.
// 환경변수 CORS_ORIGIN 은 테스트 격리를 위해 beforeEach/afterEach 에서 관리.
// ------------------------------------------------------------------ //

describe('Express Application (app.js)', () => {
  // ---------------------------------------------------------------- //
  // GET /health — 헬스체크 엔드포인트
  // ---------------------------------------------------------------- //
  describe('GET /health', () => {
    it('HTTP 200 을 반환한다', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('응답 body 에 status: "ok" 필드가 포함된다', async () => {
      const res = await request(app).get('/health');
      expect(res.body.status).toBe('ok');
    });

    it('응답 body 에 ISO 8601 형식의 timestamp 필드가 포함된다', async () => {
      const ISO_REGEX =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

      const res = await request(app).get('/health');

      expect(res.body.timestamp).toBeDefined();
      expect(res.body.timestamp).toMatch(ISO_REGEX);
    });

    it('timestamp 가 유효한 Date 로 파싱된다', async () => {
      const res = await request(app).get('/health');
      const date = new Date(res.body.timestamp);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('Content-Type 이 application/json 이다', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  // ---------------------------------------------------------------- //
  // CORS 헤더 검증
  // ---------------------------------------------------------------- //
  describe('CORS 설정', () => {
    it('기본 CORS origin 헤더(http://localhost:5173)가 응답에 포함된다', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
      );
    });

    it('Vary: Origin 헤더가 포함된다', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      // cors 미들웨어는 Vary: Origin 을 설정한다.
      expect(res.headers['vary']).toMatch(/Origin/i);
    });

    it('credentials 허용 헤더(Access-Control-Allow-Credentials)가 true 이다', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('CORS preflight OPTIONS 요청에 204 응답한다', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      // cors 미들웨어가 preflight 를 처리하면 200 또는 204 를 반환한다.
      expect([200, 204]).toContain(res.status);
    });
  });

  // ---------------------------------------------------------------- //
  // 존재하지 않는 경로 — 404
  // ---------------------------------------------------------------- //
  describe('정의되지 않은 경로', () => {
    it('GET /not-exist 에 대해 404 를 반환한다', async () => {
      const res = await request(app).get('/not-exist');
      expect(res.status).toBe(404);
    });

    it('POST /unknown 에 대해 404 를 반환한다', async () => {
      const res = await request(app).post('/unknown').send({ foo: 'bar' });
      expect(res.status).toBe(404);
    });

    it('DELETE /api/v1/ghost 에 대해 404 를 반환한다', async () => {
      const res = await request(app).delete('/api/v1/ghost');
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------- //
  // express.json() 미들웨어 — JSON body 파싱 검증
  // ---------------------------------------------------------------- //
  describe('express.json() 미들웨어', () => {
    // /health 는 GET 전용이므로 body 파싱을 검증하기 위해
    // 테스트용 라우트를 앱에 동적으로 등록한다.
    // app 은 CommonJS 모듈이고 Express 는 라우트를 동적으로 추가할 수 있다.

    let echoApp;

    beforeAll(() => {
      const express = require('express');
      const cors = require('cors');

      echoApp = express();
      echoApp.use(cors({ origin: '*' }));
      echoApp.use(express.json());
      // 파싱된 body 를 그대로 돌려주는 에코 엔드포인트
      echoApp.post('/echo', (req, res) => {
        res.status(200).json({ received: req.body });
      });
    });

    it('Content-Type: application/json 요청의 body 를 파싱한다', async () => {
      const payload = { title: '테스트 할일', done: false };

      const res = await request(echoApp)
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.received).toEqual(payload);
    });

    it('중첩 객체 body 도 올바르게 파싱한다', async () => {
      const payload = { user: { id: 1, name: '홍길동' }, tags: ['work', 'urgent'] };

      const res = await request(echoApp)
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.body.received).toEqual(payload);
    });

    it('빈 JSON body({}) 도 파싱한다', async () => {
      const res = await request(echoApp)
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.body.received).toEqual({});
    });

    it('Content-Type 이 없으면 body 가 undefined 또는 빈 객체이다', async () => {
      const res = await request(echoApp)
        .post('/echo')
        .send('plain text body');

      // express.json() 은 json 타입이 아닌 body 는 파싱하지 않는다.
      expect(res.status).toBe(200);
      const received = res.body.received;
      expect(received === undefined || (typeof received === 'object' && Object.keys(received).length === 0)).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  // 환경변수 CORS_ORIGIN 오버라이드 검증
  // ---------------------------------------------------------------- //
  describe('CORS_ORIGIN 환경변수 적용', () => {
    let customApp;

    beforeAll(() => {
      // 환경변수를 설정한 뒤 새 앱 인스턴스를 생성해 확인한다.
      const savedOrigin = process.env.CORS_ORIGIN;

      process.env.CORS_ORIGIN = 'https://custom.example.com';

      // 새 express 인스턴스 직접 구성 (app.js 로직 재현)
      const express = require('express');
      const cors = require('cors');

      customApp = express();
      customApp.use(
        cors({
          origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
          credentials: true,
        })
      );
      customApp.use(express.json());
      customApp.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
      });

      // 환경변수 복원
      if (savedOrigin === undefined) {
        delete process.env.CORS_ORIGIN;
      } else {
        process.env.CORS_ORIGIN = savedOrigin;
      }
    });

    it('커스텀 CORS_ORIGIN 이 Access-Control-Allow-Origin 에 반영된다', async () => {
      const res = await request(customApp)
        .get('/health')
        .set('Origin', 'https://custom.example.com');

      expect(res.headers['access-control-allow-origin']).toBe(
        'https://custom.example.com'
      );
    });
  });
});
