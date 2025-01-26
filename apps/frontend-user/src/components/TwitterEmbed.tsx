'use client';

import { useEffect } from 'react';

const TwitterEmbed = () => {
  useEffect(() => {
    // Twitter埋め込みスクリプトの読み込み
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default TwitterEmbed; 