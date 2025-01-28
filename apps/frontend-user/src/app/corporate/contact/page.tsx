import { Metadata } from 'next'
import ContactForm from '@/components/contact/ContactForm'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'お問い合わせ | Healthle',
  description: 'Healthleへのお問い合わせフォームページです。',
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
        <p className="text-lg text-gray-600">
          Healthleに関するお問い合わせは、以下のフォームよりお願いいたします。
        </p>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  )
} 