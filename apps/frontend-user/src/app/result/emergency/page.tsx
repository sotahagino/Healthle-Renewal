'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/solid'

export default function EmergencyResult() {
  return (
    <div className="min-h-screen bg-red-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-red-600 mb-4">緊急度：高</h1>
          <p className="text-center text-gray-700 mb-8">
            ただちに救急車を呼ぶことをお勧めします。
          </p>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h2 className="font-semibold text-red-700 mb-2">緊急通報</h2>
              <p className="text-red-600">119番通報してください。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 