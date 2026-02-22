'use client';

import { useEffect } from 'react';

const BackgroundSpline = () => {
  useEffect(() => {
    void import('@splinetool/viewer');
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <spline-viewer
        url="https://prod.spline.design/shkwkPFMXQSo6skr/scene.splinecode"
        className="w-full h-full"
        aria-hidden="true"
      />
    </div>
  );
};

export default BackgroundSpline;
