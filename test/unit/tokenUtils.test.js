'use strict';

// ------------------------------------------------------------------ //
// jsonwebtoken 모듈 전체를 모킹한다.
// generateToken / verifyToken 이 jwt.sign / jwt.verify 를 올바르게
// 호출하는지, 환경변수를 올바르게 사용하는지를 검증한다.
// ------------------------------------------------------------------ //

jest.mock('jsonwebtoken');

const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('../../src/utils/tokenUtils');

describe('tokenUtils', () => {
  // 각 테스트 전에 환경변수를 설정하고, 테스트 후 복원한다.
  let originalSecret;
  let originalExpiresIn;

  beforeEach(() => {
    originalSecret = process.env.JWT_SECRET;
    originalExpiresIn = process.env.JWT_EXPIRES_IN;

    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }

    if (originalExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    }
  });

  // ---------------------------------------------------------------- //
  // generateToken
  // ---------------------------------------------------------------- //
  describe('generateToken', () => {
    it('jwt.sign 을 정확히 1회 호출한다', () => {
      jwt.sign.mockReturnValue('mocked-token');
      const payload = { id: 1, email: 'user@example.com' };

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledTimes(1);
    });

    it('jwt.sign 에 payload 와 JWT_SECRET 을 전달한다', () => {
      jwt.sign.mockReturnValue('mocked-token');
      const payload = { id: 1, email: 'user@example.com' };

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        expect.any(Object)
      );
    });

    it('JWT_EXPIRES_IN 환경변수가 설정된 경우 해당 값을 expiresIn 으로 사용한다', () => {
      jwt.sign.mockReturnValue('mocked-token');
      process.env.JWT_EXPIRES_IN = '2h';
      const payload = { id: 1, email: 'user@example.com' };

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        { expiresIn: '2h' }
      );
    });

    it('JWT_EXPIRES_IN 환경변수가 없으면 기본값 "1h" 를 expiresIn 으로 사용한다', () => {
      jwt.sign.mockReturnValue('mocked-token');
      delete process.env.JWT_EXPIRES_IN;
      const payload = { id: 42, email: 'default@example.com' };

      generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('jwt.sign 의 반환값을 그대로 반환한다', () => {
      jwt.sign.mockReturnValue('signed-jwt-token');
      const payload = { id: 99, email: 'test@example.com' };

      const result = generateToken(payload);

      expect(result).toBe('signed-jwt-token');
    });
  });

  // ---------------------------------------------------------------- //
  // verifyToken
  // ---------------------------------------------------------------- //
  describe('verifyToken', () => {
    it('jwt.verify 를 정확히 1회 호출한다', () => {
      jwt.verify.mockReturnValue({ id: 1, email: 'user@example.com' });

      verifyToken('some-token');

      expect(jwt.verify).toHaveBeenCalledTimes(1);
    });

    it('jwt.verify 에 token 과 JWT_SECRET 을 전달한다', () => {
      jwt.verify.mockReturnValue({ id: 1, email: 'user@example.com' });

      verifyToken('some-token');

      expect(jwt.verify).toHaveBeenCalledWith('some-token', 'test-secret');
    });

    it('jwt.verify 의 반환값(decoded payload)을 그대로 반환한다', () => {
      const decoded = { id: 7, email: 'decoded@example.com', iat: 1000, exp: 2000 };
      jwt.verify.mockReturnValue(decoded);

      const result = verifyToken('valid-token');

      expect(result).toEqual(decoded);
    });

    it('jwt.verify 가 throw 하면 에러를 그대로 전파한다', () => {
      const jwtError = new Error('jwt expired');
      jwt.verify.mockImplementation(() => { throw jwtError; });

      expect(() => verifyToken('expired-token')).toThrow('jwt expired');
    });

    it('jwt.verify 가 JsonWebTokenError 를 throw 하면 에러가 전파된다', () => {
      const jwtError = new Error('invalid signature');
      jwtError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw jwtError; });

      expect(() => verifyToken('invalid-token')).toThrow('invalid signature');
    });
  });
});
