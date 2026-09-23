import { Typography } from 'antd';

export function ForumEllipsis({ text }: { text?: string }) {
  const value = text?.trim() ? text : '—';
  return (
    <Typography.Text ellipsis={{ tooltip: value }} style={{ maxWidth: '100%' }}>
      {value}
    </Typography.Text>
  );
}

export function ForumHeaderThumb({
  src,
  alt,
  size,
}: {
  src?: string;
  alt: string;
  size: 'list' | 'detail';
}) {
  const width = size === 'list' ? 96 : 160;
  const height = size === 'list' ? 54 : 90;
  const radius = size === 'list' ? 6 : 8;
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{ objectFit: 'cover', borderRadius: radius, display: 'block', background: '#f5f5f5', aspectRatio: '16 / 9' }}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        borderRadius: radius,
        background: '#f5f5f5',
        color: '#8c8c8c',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '16 / 9',
      }}
    >
      暂无背景图
    </div>
  );
}

export function ForumIconThumb({
  src,
  alt,
  size,
}: {
  src?: string;
  alt: string;
  size: 'list' | 'detail';
}) {
  const dim = size === 'list' ? 32 : 40;
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={dim}
        height={dim}
        style={{ objectFit: 'cover', borderRadius: 6, display: 'block', flexShrink: 0, background: '#f5f5f5', aspectRatio: '1 / 1' }}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={{
        width: dim,
        height: dim,
        borderRadius: 6,
        flexShrink: 0,
        background: '#f5f5f5',
        color: '#8c8c8c',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '1 / 1',
      }}
    >
      暂无图标
    </div>
  );
}
