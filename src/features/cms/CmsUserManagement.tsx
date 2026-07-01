'use client';

import { useEffect, useState } from 'react';
import type { CmsRole } from '../../lib/cms/core.ts';

type CmsManagedUser = {
  id: string;
  email: string;
  role: CmsRole;
  name: string;
  active?: boolean;
  createdAt?: string;
};

type UserFormState = {
  name: string;
  email: string;
  role: Exclude<CmsRole, 'owner'>;
  password: string;
};

const emptyForm: UserFormState = {
  name: '',
  email: '',
  role: 'client',
  password: ''
};

export function CmsUserManagement() {
  const [users, setUsers] = useState<CmsManagedUser[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const response = await fetch('/api/cms/admin/users');
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setMessage(String(payload.error || 'CMS users could not be loaded.'));
      return;
    }
    setUsers(Array.isArray(payload.users) ? payload.users : []);
  }

  async function createUser() {
    setSaving(true);
    setMessage('Creating CMS user...');
    const response = await fetch('/api/cms/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cms-request': '1' },
      body: JSON.stringify(form)
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage(String(payload.error || 'CMS user could not be created.'));
      return;
    }
    setForm(emptyForm);
    setMessage('CMS user created.');
    await loadUsers();
  }

  async function deactivateUser(id: string) {
    setMessage('Deactivating CMS user...');
    const response = await fetch(`/api/cms/admin/users/${encodeURIComponent(id)}/deactivate`, {
      method: 'POST',
      headers: { 'x-cms-request': '1' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(String(payload.error || 'CMS user could not be deactivated.'));
      return;
    }
    setMessage('CMS user deactivated.');
    await loadUsers();
  }

  return (
    <section className="cms-panel cms-user-management">
      <div className="cms-kicker">User Management</div>
      <h2>CMS users and client access</h2>
      <p>Owners can create client, editor, or admin accounts, then deactivate access when work is complete.</p>
      <div className="cms-user-create">
        <label>Name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
        <label>Email<input value={form.email} type="email" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
        <label>Role
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserFormState['role'] }))}>
            <option value="client">Client</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>Password<input value={form.password} type="password" minLength={12} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></label>
        <button type="button" onClick={() => void createUser()} disabled={saving || form.password.length < 12}>
          {saving ? 'Creating...' : 'Create User'}
        </button>
      </div>
      <div className="cms-user-actions">
        <code>/api/cms/admin/users</code>
        <code>/api/cms/admin/users/:id/deactivate</code>
      </div>
      <div className="cms-user-list">
        <button type="button" className="cms-secondary-action" onClick={() => void loadUsers()} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Users'}
        </button>
        {users.map((user) => (
          <article key={user.id} data-cms-user-active={user.active ? 'true' : 'false'}>
            <span>
              <strong>{user.name}</strong>
              <small>{user.email} · {user.role} · {user.active ? 'active' : 'inactive'}</small>
            </span>
            <button type="button" onClick={() => void deactivateUser(user.id)} disabled={!user.active}>
              Deactivate
            </button>
          </article>
        ))}
      </div>
      {message ? <p className="cms-editor-status" role="status">{message}</p> : null}
    </section>
  );
}
