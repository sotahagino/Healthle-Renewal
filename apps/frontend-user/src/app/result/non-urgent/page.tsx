'use client'

import { InformationCircleIcon } from '@heroicons/react/24/solid'

export default function NonUrgentResult() {
  return (
    <div className="min-h-screen bg-green-50">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
            <InformationCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-green-600 mb-4">緊急度：低</h1>
          <p className="text-center text-gray-700 mb-8">
            医療機関での受診をお勧めします。
          </p>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="font-semibold text-green-700 mb-2">受診のご案内</h2>
              <p className="text-green-600">近くの医療機関を探しますか？</p>
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