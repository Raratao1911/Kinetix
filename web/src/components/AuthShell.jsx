import React from 'react';
import { ShieldCheck } from "lucide-react";
import Brand from "./Brand.jsx";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-slate-50 text-ink dark:bg-darkTheme-bg dark:text-darkTheme-text">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between bg-ink px-8 py-8 text-white dark:bg-darkTheme-surface lg:grid lg:grid-rows-[1fr_auto_1fr] lg:items-start lg:px-10">
          <Brand lightBackground="bg-ink" />

          <div className="my-16 max-w-md lg:my-0">
            <h1 className="text-4xl font-semibold leading-tight">{title}</h1>
            <p className="mt-4 text-base leading-7 text-white/75">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/75 lg:self-end">
            <ShieldCheck size={20} className="text-mint" />
            <span>Movimento e cuidado em cada etapa.</span>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-xl rounded border border-slate-200 bg-white p-6 shadow-sm dark:border-darkTheme-border dark:bg-darkTheme-panel sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

