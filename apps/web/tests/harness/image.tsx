/* eslint-disable @next/next/no-img-element -- Test adapter for next/image. */
import type { ComponentProps } from 'react';
// Test-only adapter: preserve DOM semantics without Next's image optimizer.
export default function Image({
  fill,
  ...props
}: ComponentProps<'img'> & { fill?: boolean }) {
  return (
    <img
      {...props}
      alt={props.alt ?? ''}
      style={
        fill
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
          : props.style
      }
    />
  );
}
