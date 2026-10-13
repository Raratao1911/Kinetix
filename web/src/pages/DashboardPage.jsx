import React from 'react';
import { CalendarDays, LogOut, ShieldAlert, Users } from "lucide-react";
import Brand from "../components/Brand.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function DashboardPage() {
  const { session, logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50 text-ink dark:bg-darkTheme-bg dark:text-darkTheme-text">
      <header className="border-b border-slate-200 bg-sky text-white dark:border-darkTheme-border dark:bg-darkTheme-panel">
        <div className="mx-auto flex min-h-36 max-w-6xl items-center justify-between gap-4 px-5 py-2">
          <Brand inverse />
          <button className="inline-flex h-10 items-center gap-2 rounded border border-slate-300 px-3 text-sm font-medium dark:border-darkTheme-border dark:text-darkTheme-text" onClick={logout}>
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-semibold text-ink dark:text-darkTheme-text">Dashboard</h1>
        <p className="mt-1 text-slate-600 dark:text-darkTheme-muted">Bem-vindo, {session?.nome}.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded border border-slate-200 bg-white p-5 dark:border-darkTheme-border dark:bg-darkTheme-panel">
            <Users className="text-mint dark:text-mint" size={24} />
            <h2 className="mt-4 text-lg font-semibold">Pacientes ativos</h2>
            <p className="mt-1 text-3xl font-semibold">0</p>
          </article>
          <article className="rounded border border-slate-200 bg-white p-5 dark:border-darkTheme-border dark:bg-darkTheme-panel">
            <ShieldAlert className="text-mint dark:text-mint" size={24} />
            <h2 className="mt-4 text-lg font-semibold">Alertas críticos</h2>
            <p className="mt-1 text-3xl font-semibold">0</p>
          </article>
          <article className="rounded border border-slate-200 bg-white p-5 dark:border-darkTheme-border dark:bg-darkTheme-panel">
            <CalendarDays className="text-mint" size={24} />
            <h2 className="mt-4 text-lg font-semibold">Consultas hoje</h2>
            <p className="mt-1 text-3xl font-semibold">0</p>
          </article>
        </div>
      </section>
    </main>
  );
}

