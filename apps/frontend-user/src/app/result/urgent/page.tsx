'use client'

import { ExclamationCircleIcon } from '@heroicons/react/24/solid'

export default function UrgentResult() {
  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-6">
            <ExclamationCircleIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-yellow-600 mb-4">緊急度：中</h1>
          <p className="text-center text-gray-700 mb-8">
            できるだけ早く（本日中に）医療機関を受診することをお勧めします。
          </p>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="font-semibold text-yellow-700 mb-2">受診のご案内</h2>
              <p className="text-yellow-600">近くの医療機関を探しますか？</p>
              <button
                onClick={() => window.location.href = '/medical'}
                className="mt-4 w-full bg-primary text-white font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                医療機関を探す
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 