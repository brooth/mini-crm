/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module 'react-content-loader' {
  import React from 'react';
  interface ContentLoaderProps {
    animate?: boolean;
    backgroundColor?: string;
    backgroundOpacity?: number;
    baseUrl?: string;
    foregroundColor?: string;
    foregroundOpacity?: number;
    gradientRatio?: number;
    gradientDirection?: string;
    interval?: number;
    rtl?: boolean;
    speed?: number;
    title?: string;
    uniqueKey?: string;
    beforeMask?: React.ReactNode;
    style?: React.CSSProperties;
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }
  const ContentLoader: React.FC<ContentLoaderProps>;
  export default ContentLoader;
}
