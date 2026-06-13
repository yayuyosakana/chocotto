'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: '今日', icon: '🍵' },
  { href: '/new', label: '作る', icon: '➕' },
  { href: '/matches', label: 'また', icon: '🤝' },
  { href: '/me', label: 'じぶん', icon: '🙂' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-24">
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-around border-t border-[#f1e4d8] bg-white/95 py-2 backdrop-blur">
        {items.map((it) => {
          const active =
            it.href === '/' ? path === '/' : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1 text-xs font-bold transition ${
                active ? 'text-[#6f4e37]' : 'text-[#cdb7a8]'
              }`}
            >
              <span className="text-xl">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
