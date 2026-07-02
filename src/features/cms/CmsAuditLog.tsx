'use client';

import { useEffect, useMemo, useState } from 'react';

type AuditEvent = {
  id: string;
  actorId: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId: string;
  status?: string;
  method?: string;
  path?: string;
  host?: string;
  ipHash?: string;
  userAgentHash?: string;
  r2Key?: string;
  r2Status?: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

type AuditFilters = {
  action: string;
  actor: string;
  target: string;
  status: string;
  slug: string;
};

const emptyFilters: AuditFilters = {
  action: '',
  actor: '',
  target: '',
  status: '',
  slug: ''
};

export function CmsAuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const selected = useMemo(() => events.find((event) => event.id === selectedId) || events[0], [events, selectedId]);

  useEffect(() => {
    void loadAudit();
  }, []);

  async function loadAudit(nextFilters = filters) {
    setMessage('Loading audit events...');
    const query = new URLSearchParams();
    if (nextFilters.action) query.set('action', nextFilters.action);
    if (nextFilters.actor) query.set('actor', nextFilters.actor);
    if (nextFilters.target) query.set('target', nextFilters.target);
    if (nextFilters.status) query.set('status', nextFilters.status);
    if (nextFilters.slug) query.set('slug', nextFilters.slug);
    const response = await fetch(`/api/cms/admin/audit?${query.toString()}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(String(payload.error || 'CMS audit log could not be loaded.'));
      return;
    }
    const nextEvents = Array.isArray(payload.events) ? payload.events : [];
    setEvents(nextEvents);
    setSelectedId(nextEvents[0]?.id || '');
    setMessage(`${nextEvents.length} audit event${nextEvents.length === 1 ? '' : 's'} loaded.`);
  }

  async function retryR2(id: string) {
    setMessage('Retrying audit R2 write...');
    const response = await fetch(`/api/cms/admin/audit/${encodeURIComponent(id)}/retry-r2`, {
      method: 'POST',
      headers: { 'x-cms-request': '1' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(String(payload.error || 'Audit R2 write could not be retried.'));
      return;
    }
    await loadAudit();
  }

  return (
    <section className="cms-audit-shell">
      <aside className="cms-panel cms-audit-filters">
        <div className="cms-kicker">Audit</div>
        <h2>Event filters</h2>
        <label>Action<input value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} /></label>
        <label>Actor<input value={filters.actor} onChange={(event) => setFilters((current) => ({ ...current, actor: event.target.value }))} /></label>
        <label>Target<input value={filters.target} onChange={(event) => setFilters((current) => ({ ...current, target: event.target.value }))} /></label>
        <label>Status
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Any</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="denied">Denied</option>
            <option value="attempted">Attempted</option>
          </select>
        </label>
        <label>Content slug<input value={filters.slug} onChange={(event) => setFilters((current) => ({ ...current, slug: event.target.value }))} /></label>
        <button type="button" onClick={() => void loadAudit()}>Apply Filters</button>
      </aside>
      <div className="cms-panel cms-audit-table">
        <div className="cms-audit-table-head">
          <span>Time</span>
          <span>Action</span>
          <span>Actor</span>
          <span>Status</span>
          <span>R2</span>
        </div>
        {events.map((event) => (
          <button key={event.id} type="button" className="cms-audit-row" data-selected={selected?.id === event.id ? 'true' : 'false'} onClick={() => setSelectedId(event.id)}>
            <span>{formatDate(event.createdAt)}</span>
            <span>{event.action}</span>
            <span>{event.actorRole || 'user'} · {event.actorId}</span>
            <span>{event.status || 'succeeded'}</span>
            <span>{event.r2Status || 'pending'}</span>
          </button>
        ))}
        {!events.length ? <p className="cms-editor-note">No audit events match the current filters.</p> : null}
      </div>
      <aside className="cms-panel cms-audit-detail">
        <div className="cms-kicker">Event Detail</div>
        {selected ? (
          <>
            <h2>{selected.action}</h2>
            <dl>
              <dt>Target</dt><dd>{selected.targetType || 'target'} · {selected.targetId}</dd>
              <dt>Request</dt><dd>{selected.method || 'GET'} {selected.host}{selected.path}</dd>
              <dt>IP hash</dt><dd>{selected.ipHash || 'not recorded'}</dd>
              <dt>User agent hash</dt><dd>{selected.userAgentHash || 'not recorded'}</dd>
              <dt>R2 key</dt><dd>{selected.r2Key || 'not written'}</dd>
            </dl>
            {selected.r2Status === 'failed' ? <button type="button" onClick={() => void retryR2(selected.id)}>Retry R2 Write</button> : null}
            <pre>{JSON.stringify(selected.payload || {}, null, 2)}</pre>
          </>
        ) : (
          <p className="cms-editor-note">Select an audit event to inspect request metadata and storage status.</p>
        )}
      </aside>
      {message ? <p className="cms-editor-status" role="status">{message}</p> : null}
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
