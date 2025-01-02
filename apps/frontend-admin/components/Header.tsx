'use client'

import { useRouter } from 'next/navigation'

export function Header() {
  const router = useRouter()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="text-xl font-bold cursor-pointer" 
          onClick={() => router.push('/')}
        >
          Healthle Admin
        </div>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <button 
                onClick={() => router.push('/vendors')}
                className="hover:text-gray-600"
              >
                出店者管理
              </button>
            </li>
            <li>
              <button 
                onClick={() => router.push('/products')}
                className="hover:text-gray-600"
              >
                商品管理
              </button>
            </li>
            <li>
              <button 
                onClick={() => router.push('/users')}
                className="hover:text-gray-600"
              >
                ユーザー管理
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

