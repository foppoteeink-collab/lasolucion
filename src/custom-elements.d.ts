import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'l-helix': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: number | string;
        color?: string;
        speed?: number | string;
      };
    }
  }
}
