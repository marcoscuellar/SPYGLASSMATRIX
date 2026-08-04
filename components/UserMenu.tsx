'use client';
/* ============================================================
   The signed-in user's avatar + menu. Self-loads from /api/auth/me
   (the session cookie is httpOnly, so it can't be read directly).
   Shows who you are, a link to Accounts (admins only), and Sign out.
   ============================================================ */
import React from 'react';
import { useRouter } from 'next/navigation';

type Me = { name: string; email: string; role: 'admin' | 'member' };

function initialsOf(name: string): string {
  return (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('') || 'SM';
}

export function UserMenu() {
  const router = useRouter();
  const [me, setMe] = React.useState<Me | null>(null);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch('/api/auth/me').then((r) => (r.ok ? r.json() : { user: null })).then((d) => setMe(d.user)).catch(() => {});
  }, []);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
  };

  const initials = initialsOf(me?.name || '');

  return (
    <div className="umenu" ref={ref}>
      <button className="umavatar" onClick={() => setOpen((v) => !v)} aria-label="Account menu">{initials}</button>
      {open && me && (
        <div className="ummenu">
          <div className="umhead">
            <div className="umname">{me.name}</div>
            <div className="umemail">{me.email}</div>
          </div>
          {me.role === 'admin' && (
            <a className="umitem" href="/accounts">Team logins</a>
          )}
          <button className="umitem" onClick={signOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}
