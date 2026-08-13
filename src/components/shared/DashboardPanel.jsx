import React from 'react';

export default function DashboardPanel({ children, eyebrow, title }) {
  const hasHeader = eyebrow || title;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {hasHeader && (
        <>
          {eyebrow && <p className="text-xs font-black uppercase text-sea">{eyebrow}</p>}
          {title && <h2 className="mt-1 text-2xl font-black">{title}</h2>}
        </>
      )}
      <div className={hasHeader ? 'mt-5' : ''}>{children}</div>
    </section>
  );
}
