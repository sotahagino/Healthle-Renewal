"use client"

import Image from 'next/image'
import { Button } from "@/components/ui/button"

interface LoginContentProps {
  onLogin: () => void;
  returnTo?: string;
  title?: string;
  message?: string;
  additionalMessage?: React.ReactNode;
}

export function LoginContent({ onLogin, returnTo, title, message, additionalMessage }: LoginContentProps) {
  return (
    <div className="w-full">
      <div className="mb-8">
        <Image
          src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/aicon_v3_100_1017.png"
          alt="Healthle"
          width={80}
          height={80}
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-[#333333] mb-2 text-center">
          {title || "Healthleへようこそ"}
        </h1>
        <div className="text-[#666666] space-y-4">
          <p>
            {message || "LINEアカウントでログインして始めましょう"}
          </p>
          {additionalMessage}
        </div>
      </div>

      <div className="text-sm text-[#666666] bg-[#F5F5F5] p-4 rounded-lg mb-6">
        <p className="mb-2">ログインすることで、以下に同意したことになります：</p>
        <ul className="text-left list-disc pl-5 space-y-1">
          <li>利用規約</li>
          <li>プライバシーポリシー</li>
          <li>メールアドレスの取得と利用について</li>
        </ul>
        <p className="mt-2 text-xs">
          ※ メールアドレスは、アカウント管理およびサービスに関する重要なお知らせの送信にのみ使用します
        </p>
      </div>
      
      <Button 
        onClick={onLogin}
        className="w-full bg-[#00B900] hover:bg-[#00A000] text-white py-6 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg flex items-center justify-center"
        data-cy="line-login-button"
      >
        <Image
          src="https://wojtqrjpxivotuzjtgsc.supabase.co/storage/v1/object/public/Healthle/LINE_logo.svg.webp"
          alt="LINE"
          width={24}
          height={24}
          className="mr-2"
        />
        LINEでログイン
      </Button>
    </div>
  )
} 