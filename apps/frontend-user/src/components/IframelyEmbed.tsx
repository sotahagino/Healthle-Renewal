'use client';

import { useEffect } from 'react';

interface IframelyEmbedProps {
  url?: string;
}

const IframelyEmbed: React.FC<IframelyEmbedProps> = ({ url }) => {
  useEffect(() => {
    // iframelyスクリプトの再読み込み
    if (window.iframely) {
      window.iframely.load();
    } else {
      const script = document.createElement('script');
      script.src = '//cdn.iframe.ly/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [url]);

  return null;
};

export default IframelyEmbed; 