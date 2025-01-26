declare global {
  interface Window {
    iframely?: {
      load: () => void;
    };
  }
}

export {}; 