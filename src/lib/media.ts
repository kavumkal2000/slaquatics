const DEFAULT_MEDIA_BASE_URL = 'https://cdn.slaquatics.com';

export type MediaKey =
  | `brand/${string}`
  | `ops/${string}`
  | `originals/${string}`
  | `site/images/${string}`
  | `site/videos/${string}`;

export const mediaBaseUrl = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ||
  process.env.PUBLIC_MEDIA_BASE_URL ||
  DEFAULT_MEDIA_BASE_URL
).replace(/\/+$/, '');

export function mediaUrl(key: MediaKey): string {
  return `${mediaBaseUrl}/${key.replace(/^\/+/, '')}`;
}

export const media = {
  logo: mediaUrl('brand/shoreline-logo.webp'),
  heroVideo: mediaUrl('site/videos/shoreline-aquatics-hero.mp4'),
  heroModuleAnimation: mediaUrl('site/images/shoreline-aquatics-hero-module-20260630.webp?v=20260630'),
  heroPoster: mediaUrl('site/images/shoreline-jetski-group-collage.webp'),
  opsIcon180: mediaUrl('ops/shoreline-ops-app-icon-180.png'),
  opsIcon512: mediaUrl('ops/shoreline-ops-app-icon-512.png')
} as const;
