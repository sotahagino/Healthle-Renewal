import { getLineToken, verifyLineIdToken } from './line-oauth'

// jsonwebtokenのモックを先頭で設定
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}))

// モックレスポンスの定義
const mockTokenResponse = {
  id_token: 'fake_id_token',
  access_token: 'fake_access_token',
  refresh_token: 'fake_refresh_token'
}

// fetchのグローバルモック
global.fetch = jest.fn()

describe('LINE認証関連のテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getLineToken', () => {
    it('正常系：有効なcodeでトークンを取得できる', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      })

      const result = await getLineToken('valid_code')
      expect(result).toEqual(mockTokenResponse)
    })

    it('異常系：無効なcodeでエラーになる', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' })
      })

      await expect(getLineToken('invalid_code')).rejects.toThrow('Failed to get LINE token')
    })
  })

  describe('verifyLineIdToken', () => {
    it('正常系：有効なトークンで検証できる', async () => {
      const mockPayload = {
        sub: 'line_user_123',
        name: 'テストユーザー',
        picture: 'https://example.com/photo.jpg'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayload
      })

      const result = await verifyLineIdToken('valid_token')
      expect(result).toEqual(mockPayload)
    })

    it('異常系：無効なトークンでエラーになる', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_token' })
      })

      await expect(verifyLineIdToken('invalid_token')).rejects.toThrow('Failed to verify LINE ID token')
    })
  })
}) 