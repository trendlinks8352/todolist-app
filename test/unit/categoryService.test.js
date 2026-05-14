'use strict';

// ------------------------------------------------------------------ //
// categoryService.test.js
// 모든 외부 의존성을 jest.mock 으로 격리하여
// categoryService 의 비즈니스 로직만 단위 테스트한다.
// ------------------------------------------------------------------ //

jest.mock('../../src/repositories/categoryRepository');

const categoryRepository = require('../../src/repositories/categoryRepository');
const categoryService = require('../../src/services/categoryService');
const { AppError } = require('../../src/middlewares/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../../src/constants/constants');

// ------------------------------------------------------------------ //
// 공통 픽스처
// ------------------------------------------------------------------ //
const USER_ID = 'user-uuid-001';
const CATEGORY_ID = 'cat-uuid-001';

const MOCK_CATEGORY = {
  id: CATEGORY_ID,
  userId: USER_ID,
  name: '업무',
  isDefault: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const MOCK_DEFAULT_CATEGORY = {
  id: 'default-cat-uuid',
  userId: null,
  name: '일반',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ==================================================================
// getCategories
// ==================================================================
describe('categoryService.getCategories', () => {
  it('categoryRepository.findAllByUser 가 userId 로 호출된다', async () => {
    categoryRepository.findAllByUser.mockResolvedValue([MOCK_CATEGORY]);

    await categoryService.getCategories(USER_ID);

    expect(categoryRepository.findAllByUser).toHaveBeenCalledWith(USER_ID);
    expect(categoryRepository.findAllByUser).toHaveBeenCalledTimes(1);
  });

  it('{ data: [...] } 형태로 카테고리 목록을 반환한다', async () => {
    const mockList = [MOCK_DEFAULT_CATEGORY, MOCK_CATEGORY];
    categoryRepository.findAllByUser.mockResolvedValue(mockList);

    const result = await categoryService.getCategories(USER_ID);

    expect(result).toHaveProperty('data');
    expect(result.data).toEqual(mockList);
  });

  it('카테고리가 없으면 { data: [] } 를 반환한다', async () => {
    categoryRepository.findAllByUser.mockResolvedValue([]);

    const result = await categoryService.getCategories(USER_ID);

    expect(result).toEqual({ data: [] });
  });

  it('반환 구조가 { data } 키만 가진다', async () => {
    categoryRepository.findAllByUser.mockResolvedValue([MOCK_CATEGORY]);

    const result = await categoryService.getCategories(USER_ID);

    expect(Object.keys(result)).toEqual(['data']);
  });
});

// ==================================================================
// createCategory
// ==================================================================
describe('categoryService.createCategory', () => {
  describe('정상 생성', () => {
    beforeEach(() => {
      categoryRepository.findByNameAndUser.mockResolvedValue(null);
      categoryRepository.create.mockResolvedValue(MOCK_CATEGORY);
    });

    it('findByNameAndUser 가 trimmed name 과 userId 로 호출된다', async () => {
      await categoryService.createCategory(USER_ID, '업무');

      expect(categoryRepository.findByNameAndUser).toHaveBeenCalledWith('업무', USER_ID);
      expect(categoryRepository.findByNameAndUser).toHaveBeenCalledTimes(1);
    });

    it('앞뒤 공백이 있는 name 은 trim 후 create 가 호출된다', async () => {
      await categoryService.createCategory(USER_ID, '  업무  ');

      expect(categoryRepository.create).toHaveBeenCalledWith({
        userId: USER_ID,
        name: '업무',
      });
    });

    it('중복이 없으면 categoryRepository.create 가 호출된다', async () => {
      await categoryService.createCategory(USER_ID, '업무');

      expect(categoryRepository.create).toHaveBeenCalledWith({
        userId: USER_ID,
        name: '업무',
      });
    });

    it('create 의 반환값을 그대로 반환한다', async () => {
      const result = await categoryService.createCategory(USER_ID, '업무');

      expect(result).toEqual(MOCK_CATEGORY);
    });

    it('findByNameAndUser 는 항상 trim 된 이름으로 호출된다', async () => {
      await categoryService.createCategory(USER_ID, '   개인   ');

      expect(categoryRepository.findByNameAndUser).toHaveBeenCalledWith('개인', USER_ID);
    });
  });

  describe('실패 케이스 — trim 후 빈 문자열', () => {
    it('공백만 있는 name 은 AppError(422) 를 throw 한다', async () => {
      await expect(
        categoryService.createCategory(USER_ID, '   ')
      ).rejects.toThrow(AppError);
    });

    it('공백만 있는 name 의 에러 statusCode 가 422 이다', async () => {
      await expect(
        categoryService.createCategory(USER_ID, '   ')
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    });

    it('빈 문자열 name 은 AppError(422) 를 throw 한다', async () => {
      await expect(
        categoryService.createCategory(USER_ID, '')
      ).rejects.toThrow(AppError);
    });

    it('422 에러 시 findByNameAndUser 와 create 는 호출되지 않는다', async () => {
      await categoryService.createCategory(USER_ID, '   ').catch(() => {});

      expect(categoryRepository.findByNameAndUser).not.toHaveBeenCalled();
      expect(categoryRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('실패 케이스 — 중복 이름', () => {
    beforeEach(() => {
      categoryRepository.findByNameAndUser.mockResolvedValue({ id: CATEGORY_ID });
    });

    it('중복 이름이면 AppError(409) 를 throw 한다', async () => {
      await expect(
        categoryService.createCategory(USER_ID, '업무')
      ).rejects.toThrow(AppError);
    });

    it('중복 이름 에러의 statusCode 가 409 이다', async () => {
      await expect(
        categoryService.createCategory(USER_ID, '업무')
      ).rejects.toMatchObject({
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT,
      });
    });

    it('409 에러 시 create 는 호출되지 않는다', async () => {
      await categoryService.createCategory(USER_ID, '업무').catch(() => {});

      expect(categoryRepository.create).not.toHaveBeenCalled();
    });

    it('대소문자 무시 중복 체크는 findByNameAndUser 에 trimmed name 을 전달해 수행한다', async () => {
      await categoryService.createCategory(USER_ID, 'Work').catch(() => {});

      expect(categoryRepository.findByNameAndUser).toHaveBeenCalledWith('Work', USER_ID);
    });
  });
});

// ==================================================================
// validateCategoryAccess
// ==================================================================
describe('categoryService.validateCategoryAccess', () => {
  it('categoryRepository.findAccessible 이 userId 와 categoryId 로 호출된다', async () => {
    categoryRepository.findAccessible.mockResolvedValue({ id: CATEGORY_ID });

    await categoryService.validateCategoryAccess(USER_ID, CATEGORY_ID);

    expect(categoryRepository.findAccessible).toHaveBeenCalledWith(USER_ID, CATEGORY_ID);
    expect(categoryRepository.findAccessible).toHaveBeenCalledTimes(1);
  });

  it('카테고리가 접근 가능하면 에러를 throw 하지 않는다', async () => {
    categoryRepository.findAccessible.mockResolvedValue({ id: CATEGORY_ID });

    await expect(
      categoryService.validateCategoryAccess(USER_ID, CATEGORY_ID)
    ).resolves.toBeUndefined();
  });

  it('카테고리가 접근 불가(null 반환)이면 AppError(404) 를 throw 한다', async () => {
    categoryRepository.findAccessible.mockResolvedValue(null);

    await expect(
      categoryService.validateCategoryAccess(USER_ID, 'nonexistent-cat-id')
    ).rejects.toThrow(AppError);
  });

  it('404 에러의 statusCode 가 404 이다', async () => {
    categoryRepository.findAccessible.mockResolvedValue(null);

    await expect(
      categoryService.validateCategoryAccess(USER_ID, 'nonexistent-cat-id')
    ).rejects.toMatchObject({
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: ERROR_CODES.NOT_FOUND,
    });
  });

  it('404 에러 메시지에 카테고리 관련 내용이 포함된다', async () => {
    categoryRepository.findAccessible.mockResolvedValue(null);

    await expect(
      categoryService.validateCategoryAccess(USER_ID, 'nonexistent-cat-id')
    ).rejects.toMatchObject({
      message: '카테고리를 찾을 수 없습니다.',
    });
  });
});
