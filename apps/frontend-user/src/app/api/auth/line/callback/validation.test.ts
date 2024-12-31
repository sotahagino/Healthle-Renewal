import { validateCallbackRequest } from './validation'

describe('LINE コールバックバリデーション', () => {
  it('正常系：必要なパラメータが存在する場合', () => {
    const validBody = {
      code: 'valid_code',
      state: 'valid_state'
    }

    const result = validateCallbackRequest(validBody)
    expect(result).toEqual({
      code: 'valid_code',
      state: 'valid_state'
    })
  })

  it('異常系：codeが存在しない場合', () => {
    const invalidBody = {
      state: 'valid_state'
    }

    expect(() => validateCallbackRequest(invalidBody)).toThrow('code is required')
  })

  it('異常系：stateが存在しない場合', () => {
    const invalidBody = {
      code: 'valid_code'
    }

    expect(() => validateCallbackRequest(invalidBody)).toThrow('state is required')
  })
}) 