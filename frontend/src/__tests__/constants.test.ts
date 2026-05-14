import { describe, it, expect } from 'vitest'
import { TODO_CONSTANTS, CATEGORY_CONSTANTS, HTTP_STATUS, ERROR_CODES } from '@/constants/constants'

describe('TODO_CONSTANTS', () => {
  it('MAX_TITLE_LENGTH는 200이어야 한다', () => {
    expect(TODO_CONSTANTS.MAX_TITLE_LENGTH).toBe(200)
  })
})

describe('CATEGORY_CONSTANTS', () => {
  it('MAX_NAME_LENGTH는 50이어야 한다', () => {
    expect(CATEGORY_CONSTANTS.MAX_NAME_LENGTH).toBe(50)
  })
})

describe('HTTP_STATUS', () => {
  it('200 OK', () => expect(HTTP_STATUS.OK).toBe(200))
  it('201 CREATED', () => expect(HTTP_STATUS.CREATED).toBe(201))
  it('204 NO_CONTENT', () => expect(HTTP_STATUS.NO_CONTENT).toBe(204))
  it('400 BAD_REQUEST', () => expect(HTTP_STATUS.BAD_REQUEST).toBe(400))
  it('401 UNAUTHORIZED', () => expect(HTTP_STATUS.UNAUTHORIZED).toBe(401))
  it('403 FORBIDDEN', () => expect(HTTP_STATUS.FORBIDDEN).toBe(403))
  it('404 NOT_FOUND', () => expect(HTTP_STATUS.NOT_FOUND).toBe(404))
  it('409 CONFLICT', () => expect(HTTP_STATUS.CONFLICT).toBe(409))
  it('422 UNPROCESSABLE_ENTITY', () => expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422))
  it('500 INTERNAL_SERVER_ERROR', () => expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500))
})

describe('ERROR_CODES', () => {
  it('UNAUTHORIZED 문자열', () => expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED'))
  it('FORBIDDEN 문자열', () => expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN'))
  it('NOT_FOUND 문자열', () => expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND'))
  it('CONFLICT 문자열', () => expect(ERROR_CODES.CONFLICT).toBe('CONFLICT'))
  it('VALIDATION_ERROR 문자열', () => expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR'))
  it('INTERNAL_ERROR 문자열', () => expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR'))
})
