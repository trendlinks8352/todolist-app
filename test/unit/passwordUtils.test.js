'use strict';

// ------------------------------------------------------------------ //
// bcrypt 모듈 전체를 모킹한다.
// hashPassword / comparePassword 가 bcrypt.hash / bcrypt.compare 를
// 올바르게 호출하는지, 환경변수(BCRYPT_SALT_ROUNDS)를 올바르게
// 사용하는지를 검증한다.
// ------------------------------------------------------------------ //

jest.mock('bcrypt');

const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../../src/utils/passwordUtils');

describe('passwordUtils', () => {
  let originalSaltRounds;

  beforeEach(() => {
    originalSaltRounds = process.env.BCRYPT_SALT_ROUNDS;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalSaltRounds === undefined) {
      delete process.env.BCRYPT_SALT_ROUNDS;
    } else {
      process.env.BCRYPT_SALT_ROUNDS = originalSaltRounds;
    }
  });

  // ---------------------------------------------------------------- //
  // hashPassword
  // ---------------------------------------------------------------- //
  describe('hashPassword', () => {
    it('bcrypt.hash 를 정확히 1회 호출한다', async () => {
      bcrypt.hash.mockResolvedValue('hashed-password');
      process.env.BCRYPT_SALT_ROUNDS = '10';

      await hashPassword('plaintext');

      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });

    it('bcrypt.hash 에 평문 비밀번호와 rounds 를 전달한다', async () => {
      bcrypt.hash.mockResolvedValue('hashed-password');
      process.env.BCRYPT_SALT_ROUNDS = '12';

      await hashPassword('mypassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 12);
    });

    it('BCRYPT_SALT_ROUNDS 환경변수 값을 정수로 변환해 사용한다', async () => {
      bcrypt.hash.mockResolvedValue('hashed-password');
      process.env.BCRYPT_SALT_ROUNDS = '14';

      await hashPassword('somepassword');

      const [, roundsArg] = bcrypt.hash.mock.calls[0];
      expect(roundsArg).toBe(14);
      expect(typeof roundsArg).toBe('number');
    });

    it('BCRYPT_SALT_ROUNDS 환경변수가 없으면 기본값 10 을 사용한다', async () => {
      bcrypt.hash.mockResolvedValue('hashed-password');
      delete process.env.BCRYPT_SALT_ROUNDS;

      await hashPassword('defaultrounds');

      const [, roundsArg] = bcrypt.hash.mock.calls[0];
      expect(roundsArg).toBe(10);
    });

    it('BCRYPT_SALT_ROUNDS 가 파싱 불가한 값이면 기본값 10 을 사용한다', async () => {
      bcrypt.hash.mockResolvedValue('hashed-password');
      process.env.BCRYPT_SALT_ROUNDS = 'invalid';

      await hashPassword('somepassword');

      const [, roundsArg] = bcrypt.hash.mock.calls[0];
      expect(roundsArg).toBe(10);
    });

    it('bcrypt.hash 의 반환값(해시)을 그대로 반환한다', async () => {
      const mockHash = '$2b$10$mockedHashValue';
      bcrypt.hash.mockResolvedValue(mockHash);
      process.env.BCRYPT_SALT_ROUNDS = '10';

      const result = await hashPassword('plaintext');

      expect(result).toBe(mockHash);
    });

    it('bcrypt.hash 가 reject 하면 에러를 전파한다', async () => {
      bcrypt.hash.mockRejectedValue(new Error('hash error'));
      process.env.BCRYPT_SALT_ROUNDS = '10';

      await expect(hashPassword('plaintext')).rejects.toThrow('hash error');
    });
  });

  // ---------------------------------------------------------------- //
  // comparePassword
  // ---------------------------------------------------------------- //
  describe('comparePassword', () => {
    it('bcrypt.compare 를 정확히 1회 호출한다', async () => {
      bcrypt.compare.mockResolvedValue(true);

      await comparePassword('plain', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('bcrypt.compare 에 평문과 해시를 전달한다', async () => {
      bcrypt.compare.mockResolvedValue(true);

      await comparePassword('mypassword', '$2b$10$someHash');

      expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', '$2b$10$someHash');
    });

    it('비밀번호가 일치하면 true 를 반환한다', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword('correctpassword', '$2b$10$correctHash');

      expect(result).toBe(true);
    });

    it('비밀번호가 불일치하면 false 를 반환한다', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword('wrongpassword', '$2b$10$correctHash');

      expect(result).toBe(false);
    });

    it('bcrypt.compare 가 reject 하면 에러를 전파한다', async () => {
      bcrypt.compare.mockRejectedValue(new Error('compare error'));

      await expect(comparePassword('plain', 'hash')).rejects.toThrow('compare error');
    });
  });
});
