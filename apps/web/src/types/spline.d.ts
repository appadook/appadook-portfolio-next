import 'react';
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': {
        url: string;
        className?: string;
        'aria-hidden'?: 'true' | 'false';
      };
    }
  }
}
