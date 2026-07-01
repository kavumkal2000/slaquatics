'use client';

import { useState } from 'react';
import type { CmsMediaAsset } from '../../lib/cms/core.ts';

type CmsMediaUsage = {
  id: string;
  title: string;
  slug: string;
  contentType: string;
};

type CmsMediaAssetWithUsage = CmsMediaAsset & {
  usedBy?: CmsMediaUsage[];
};

type MediaLibraryState = {
  message: string;
  loading: boolean;
  uploading: boolean;
  saving: string;
};

const emptyState: MediaLibraryState = {
  message: '',
  loading: false,
  uploading: false,
  saving: ''
};

export function CmsMediaLibrary() {
  const [assets, setAssets] = useState<CmsMediaAssetWithUsage[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [state, setState] = useState<MediaLibraryState>(emptyState);

  async function loadAssets() {
    setState((current) => ({ ...current, loading: true, message: 'Loading media library...' }));
    const params = new URLSearchParams('limit=100');
    if (mediaSearch.trim()) params.set('q', mediaSearch.trim());
    const endpoint = mediaSearch.trim() ? `/api/cms/admin/media?${params.toString()}` : '/api/cms/admin/media?limit=100';
    const response = await fetch(endpoint);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, loading: false, message: String(payload.error || 'Media library failed to load.') }));
      return;
    }
    setAssets(Array.isArray(payload.assets) ? payload.assets : []);
    setState((current) => ({ ...current, loading: false, message: 'Media library loaded.' }));
  }

  async function uploadAsset(file: File | undefined) {
    if (!file) return;
    setState((current) => ({ ...current, uploading: true, message: 'Uploading media...' }));
    const response = await fetch('/api/cms/admin/media/upload', {
      method: 'POST',
      headers: { 'content-type': file.type || 'application/octet-stream', 'x-cms-request': '1' },
      body: file
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, uploading: false, message: String(payload.error || 'Media upload failed.') }));
      return;
    }
    const asset = payload.asset as CmsMediaAsset | undefined;
    if (asset) setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    setState((current) => ({ ...current, uploading: false, message: `Media uploaded: ${asset?.key || 'asset saved'}` }));
  }

  async function saveAsset(asset: CmsMediaAsset) {
    setState((current) => ({ ...current, saving: asset.id, message: 'Saving media metadata...' }));
    const response = await fetch('/api/cms/admin/media', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify({ asset })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState((current) => ({ ...current, saving: '', message: String(payload.error || 'Media metadata failed to save.') }));
      return;
    }
    const saved = payload.asset as CmsMediaAsset;
    setAssets((current) => current.map((item) => item.id === saved.id ? saved : item));
    setState((current) => ({ ...current, saving: '', message: 'Media metadata saved.' }));
  }

  function updateAsset(id: string, updater: (asset: CmsMediaAsset) => CmsMediaAsset) {
    setAssets((current) => current.map((asset) => asset.id === id ? updater(asset) : asset));
  }

  return (
    <section className="cms-panel cms-media-manager">
      <div className="cms-media-manager-head">
        <div>
          <div className="cms-kicker">Media Library</div>
          <h2>Images, video, alt text, crop, and focal point</h2>
        </div>
        <button type="button" onClick={loadAssets} disabled={state.loading}>
          {state.loading ? 'Loading...' : 'Load Library'}
        </button>
      </div>
      <label className="cms-upload-target">
        Upload image or video
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(event) => void uploadAsset(event.target.files?.[0])}
          disabled={state.uploading}
        />
      </label>
      <label>
        Search media
        <input
          value={mediaSearch}
          placeholder="Search filenames, alt text, captions, or usage"
          onChange={(event) => setMediaSearch(event.target.value)}
        />
      </label>
      <div className="cms-media-edit-list">
        {assets.map((asset) => (
          <article className="cms-media-edit-card" key={asset.id}>
            {asset.contentType.startsWith('image/') ? <img src={asset.url} alt={asset.alt || ''} /> : <video src={asset.url} controls />}
            <div className="cms-field-grid">
              <label>
                Asset URL
                <input value={asset.url} readOnly />
              </label>
              <label>
                Alt text
                <input value={asset.alt} onChange={(event) => updateAsset(asset.id, (item) => ({ ...item, alt: event.target.value }))} />
              </label>
              <label className="cms-field-wide">
                Caption
                <textarea value={asset.caption || ''} onChange={(event) => updateAsset(asset.id, (item) => ({ ...item, caption: event.target.value }))} />
              </label>
              <label>
                Crop
                <input value={asset.image?.crop || 'original'} onChange={(event) => updateAsset(asset.id, (item) => ({ ...item, image: { ...item.image, crop: event.target.value, focalPoint: item.image?.focalPoint || { x: 50, y: 50 } } }))} />
              </label>
              <label>
                Focal X
                <input type="number" min="0" max="100" value={asset.image?.focalPoint?.x ?? 50} onChange={(event) => updateAsset(asset.id, (item) => ({ ...item, image: { ...item.image, crop: item.image?.crop || 'original', focalPoint: { x: Number(event.target.value), y: item.image?.focalPoint?.y ?? 50 } } }))} />
              </label>
              <label>
                Focal Y
                <input type="number" min="0" max="100" value={asset.image?.focalPoint?.y ?? 50} onChange={(event) => updateAsset(asset.id, (item) => ({ ...item, image: { ...item.image, crop: item.image?.crop || 'original', focalPoint: { x: item.image?.focalPoint?.x ?? 50, y: Number(event.target.value) } } }))} />
              </label>
            </div>
            <button type="button" onClick={() => void saveAsset(asset)} disabled={state.saving === asset.id}>
              {state.saving === asset.id ? 'Saving...' : 'Save Metadata'}
            </button>
            <div className="cms-media-usage">
              <strong>Used by</strong>
              {asset.usedBy?.length ? (
                <ul>
                  {asset.usedBy.map((usage) => (
                    <li key={`${asset.id}-${usage.id}`}>
                      {usage.title} <span>{usage.contentType} · {usage.slug}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cms-editor-note">No readable CMS content references this asset yet.</p>
              )}
            </div>
          </article>
        ))}
      </div>
      {!assets.length ? <p className="cms-editor-note">Load or upload media to manage reusable CMS assets.</p> : null}
      {state.message ? <p className="cms-editor-status" role="status">{state.message}</p> : null}
    </section>
  );
}
