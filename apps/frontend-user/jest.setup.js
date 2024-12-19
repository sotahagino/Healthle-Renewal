// グローバルなモックの設定
require('@testing-library/jest-dom')

// fetchのグローバルモック
global.fetch = jest.fn()

// jestのグローバル変数は自動的に利用可能なので定義不要 