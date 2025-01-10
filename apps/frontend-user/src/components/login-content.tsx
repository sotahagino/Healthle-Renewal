"use client"

import React from 'react';
import { Button } from '@/components/ui/button';

interface LoginContentProps {
  onLogin: () => void;
  returnTo: string;
  title: string;
  message: string;
  additionalMessage: React.ReactElement;
}

export const LoginContent: React.FC<LoginContentProps> = ({
  onLogin,
  returnTo,
  title,
  message,
  additionalMessage
}) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#4C9A84] mb-4">{title}</h2>
      <p className="text-[#666666] mb-6">{message}</p>
      {additionalMessage}
      <Button
        onClick={onLogin}
        className="w-full bg-[#4C9A84] hover:bg-[#3A8B73] text-white mt-6"
      >
        LINEで連携する
      </Button>
    </div>
  );
}; 