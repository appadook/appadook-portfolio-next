import { ImageResponse } from 'next/og';
export const alt = 'Kurtik Appadoo — Software Engineer & Data Scientist';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function SocialImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#101014',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 90,
        color: '#f6f1e7',
      }}
    >
      <div
        style={{
          color: '#dab64d',
          fontSize: 22,
          letterSpacing: 6,
          marginBottom: 35,
        }}
      >
        SOFTWARE · DATA · RESEARCH
      </div>
      <div style={{ fontSize: 88 }}>Kurtik Appadoo</div>
      <div style={{ fontSize: 30, color: '#aaa6a0', marginTop: 30 }}>
        Software Engineer & Data Scientist
      </div>
    </div>,
    size,
  );
}
