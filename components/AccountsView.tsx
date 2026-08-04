'use client';
/* ============================================================
   Accounts — admin manages team logins. Add a leader, get a ready-
   to-send link + temporary password to copy, review who has access,
   and remove anyone. Writes through /api/team.
   ============================================================ */
import React from 'react';
import { Lockup } from './ui';
import { UserMenu } from './UserMenu';
import type { Role, User } from '@/lib/types';

type Created = { user: User; tempPassword: string; loginUrl: string };

export function AccountsView({ initial }: { initial: User[] }) {
  const [list, setList] = React.useState<User[]>(initial);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<Role>('member');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [created, setCreated] = React.useState<Created | null>(null);
  const [copied, setCopied] = React.useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setCreated(null); setBusy(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Could not create the account.'); setBusy(false); return; }
      setCreated(data);
      setList((l) => [...l, data.user]);
      setName(''); setEmail(''); setRole('member');
    } catch {
      setError('Something went wrong. Try again.');
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    setList((l) => l.filter((u) => u.id !== id));
    await fetch(`/api/team/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1400);
  };

  const inviteText = (c: Created) =>
    `You've been given access to Spyglass Matrix.\n\nSign in: ${c.loginUrl}\nEmail: ${c.user.email}\nTemporary password: ${c.tempPassword}\n\nYou'll be asked to set your own password on first sign-in.`;

  return (
    <div className="acct">
      <div className="topbar">
        <div className="topinner">
          <Lockup sub="Accounts" size={24} href="/desk" />
          <div className="spacer" />
          <UserMenu />
        </div>
      </div>

      <div className="wrap">
        <div className="eyebrow">Team logins</div>
        <h1>Give your team <span className="mk">access</span>.</h1>
        <p className="sub">Create a login, then send them the link and temporary password. They set their own password on first sign-in.</p>

        <div className="card addcard">
          <div className="card-h">Add a login</div>
          <form onSubmit={add} className="addform">
            <div className="grid">
              <div className="fld"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Rivera" required /></div>
              <div className="fld"><label>Work email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jordan@firm.com" required /></div>
              <div className="fld">
                <label>Access</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="member">Leadership (view)</option>
                  <option value="admin">Admin (manage logins)</option>
                </select>
              </div>
            </div>
            {error && <div className="err">{error}</div>}
            <div className="addbar">
              <button className="btn-primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create login'}</button>
            </div>
          </form>

          {created && (
            <div className="invite">
              <div className="inv-h">Login ready — send this to {created.user.name.split(' ')[0]}</div>
              <div className="inv-rows">
                <div className="inv-row"><span className="k">Sign in</span><span className="v">{created.loginUrl}</span><button onClick={() => copy('url', created.loginUrl)}>{copied === 'url' ? 'Copied' : 'Copy'}</button></div>
                <div className="inv-row"><span className="k">Email</span><span className="v">{created.user.email}</span><button onClick={() => copy('email', created.user.email)}>{copied === 'email' ? 'Copied' : 'Copy'}</button></div>
                <div className="inv-row"><span className="k">Temp password</span><span className="v mono">{created.tempPassword}</span><button onClick={() => copy('pw', created.tempPassword)}>{copied === 'pw' ? 'Copied' : 'Copy'}</button></div>
              </div>
              <button className="inv-copyall" onClick={() => copy('all', inviteText(created))}>{copied === 'all' ? 'Copied the whole message ✓' : 'Copy the whole invite message'}</button>
              <div className="inv-note">The temporary password is shown once here — copy it now. They’ll set their own on first sign-in.</div>
            </div>
          )}
        </div>

        <div className="listhead">
          <span className="lh-t">Who has access</span>
          <span className="lh-n">{list.length} {list.length === 1 ? 'person' : 'people'}</span>
        </div>
        <div className="card">
          {list.length === 0 ? (
            <div className="empty">No logins yet. Add one above.</div>
          ) : list.map((u) => (
            <div className="urow" key={u.id}>
              <span className="ua">{(u.name || '?').split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('')}</span>
              <div className="uinfo">
                <div className="un">{u.name} {u.role === 'admin' && <span className="rolechip">Admin</span>}</div>
                <div className="ue">{u.email}</div>
              </div>
              <span className={'ustatus' + (u.mustReset ? ' pending' : '')}>{u.mustReset ? 'Temp password' : 'Active'}</span>
              <button className="urm" onClick={() => remove(u.id)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="foot">Spyglass Matrix · engine: Ollin:Hire · account administration</div>
      </div>
    </div>
  );
}
