import React, { useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Brand from "../components/Brand.jsx";
import {
  Activity,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  LogIn,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users
} from "lucide-react";

const quickLinks = [
  { label: "Buscar fisioterapeutas", icon: Search, to: "/profissionais" },
  { label: "Agendar consulta", icon: CalendarCheck, to: "/profissionais" },
  { label: "Área do paciente", icon: HeartPulse, to: "/dashboard" },
  { label: "Área profissional", icon: Stethoscope, to: "/dashboard" },
  { label: "Planos de reabilitação", icon: ClipboardList, to: "/dashboard" },
  { label: "Clínicas próximas", icon: MapPin, to: "/profissionais" },
  { label: "Histórico de sessões", icon: Activity, to: "/agenda" }
];

const heroActions = [
  { label: "Entrar como paciente", to: "/login" },
  { label: "Entrar como fisioterapeuta", to: "/login" },
  { label: "Criar nova conta", to: "/cadastro" },
  { label: "Encontrar atendimento", to: "/profissionais" }
];

export default function HomePage() {
  const location = useLocation();
  useLayoutEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.key, location.hash]);

  return (
    <main className="min-h-screen bg-slate-50 text-ink dark:bg-darkTheme-bg dark:text-darkTheme-text">
      <div className="border-b border-slate-200 bg-white dark:border-darkTheme-border dark:bg-darkTheme-panel">
        <div className="mx-auto flex h-10 max-w-6xl items-center justify-end gap-5 px-5 text-sm font-semibold text-sky dark:text-darkTheme-muted">
          <Link className="inline-flex items-center gap-1.5 hover:text-mint" to="/login">
            <LogIn size={15} />
            Sou Paciente
          </Link>
          <Link className="inline-flex items-center gap-1.5 hover:text-mint" to="/login">
            <Stethoscope size={15} />
            Sou Fisioterapeuta
          </Link>
          <Link className="inline-flex items-center gap-1.5 hover:text-mint" to="/cadastro">
            <Users size={15} />
            Criar conta
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-sky text-white shadow-sm dark:border-darkTheme-border dark:bg-darkTheme-panel">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3">
          <Brand />

          <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm font-semibold">
            <a className="hover:text-mint" href="#kinetix">O Kinetix</a>
            <a className="hover:text-mint" href="#destaques">Destaques</a>
            <a className="hover:text-mint" href="#acesso">Acesso rápido</a>
            <Link className="hover:text-mint" to="/cadastro">Cadastrar</Link>
          </nav>

          <form action="/profissionais" className="flex h-10 w-full max-w-[240px] items-center rounded bg-white px-4 text-slate-500 shadow-sm dark:bg-darkTheme-surface dark:text-darkTheme-muted">
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-500 dark:text-darkTheme-text"
              name="cidade"
              placeholder="Buscar por cidade..."
              aria-label="Buscar por cidade"
            />
            <button type="submit" title="Buscar profissionais" aria-label="Buscar profissionais" className="flex h-10 w-8 shrink-0 items-center justify-center"><Search size={18} className="text-sky dark:text-darkTheme-action" /></button>
          </form>
        </div>
      </header>

      <section id="kinetix" className="relative overflow-hidden bg-sky dark:bg-darkTheme-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(0,168,255,0.32),transparent_34%),linear-gradient(115deg,rgba(15,23,42,0.96),rgba(0,31,61,0.74))]" />
        <div className="relative mx-auto grid min-h-[520px] max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="overflow-hidden rounded border border-white/15 bg-white shadow-2xl dark:border-darkTheme-border dark:bg-darkTheme-panel">
            <div className="h-8 bg-sky dark:bg-darkTheme-surface" />
            <div className="divide-y divide-slate-200 p-6 dark:divide-darkTheme-border">
              <p className="pb-4 text-base font-semibold text-sky dark:text-darkTheme-text">Como começar no Kinetix?</p>
              {heroActions.map((item) => (
                <Link
                  key={item.label}
                  className="flex items-center justify-between py-4 text-sm font-semibold text-slate-700 transition hover:text-mint dark:text-darkTheme-muted"
                  to={item.to}
                >
                  {item.label}
                  <span aria-hidden="true">›</span>
                </Link>
              ))}
            </div>
          </aside>

          <div className="text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles size={16} className="text-mint" />
              Agenda, busca e acompanhamento em um só lugar
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Encontre fisioterapeutas, organize consultas e acompanhe sua reabilitação.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
              O Kinetix conecta pacientes, fisioterapeutas e clínicas com cadastro por perfil, agendamentos e planos de cuidado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex h-11 items-center justify-center rounded bg-mint px-5 font-semibold text-ink transition hover:bg-mintHover hover:text-white" to="/cadastro">
                Criar conta
              </Link>
              <Link className="inline-flex h-11 items-center justify-center rounded border border-white/35 px-5 font-semibold text-white transition hover:border-mint hover:text-mint" to="/login">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="destaques" className="bg-white py-16 dark:bg-darkTheme-bg">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-center justify-center gap-8">
            <span className="hidden h-14 w-1 bg-mint sm:block" />
            <h2 className="text-center text-3xl font-semibold text-sky dark:text-darkTheme-text">O que está em alta no Kinetix?</h2>
            <span className="hidden h-14 w-1 bg-mint sm:block" />
          </div>

          <article className="mx-auto mt-12 grid max-w-5xl overflow-hidden rounded bg-slate-50 shadow-sm dark:bg-darkTheme-panel md:grid-cols-[1.25fr_0.75fr]">
            <div className="flex min-h-[300px] items-center justify-center bg-kinetixBg p-8 dark:bg-darkTheme-surface">
              <div className="grid w-full max-w-lg grid-cols-3 gap-4">
                {["Paciente", "Agenda", "Plano", "Clinica", "Busca", "Evolucao"].map((item) => (
                  <div key={item} className="rounded border border-white/70 bg-white/85 p-4 text-center text-sm font-semibold text-sky shadow-sm dark:border-darkTheme-border dark:bg-darkTheme-panel dark:text-darkTheme-text">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center p-8">
              <p className="self-end text-sm font-bold text-sky dark:text-darkTheme-muted">1/3</p>
              <h3 className="mt-10 text-3xl font-semibold text-ink dark:text-darkTheme-text">Agenda integrada</h3>
              <div className="mt-3 h-px w-40 bg-sky dark:bg-darkTheme-border" />
              <p className="mt-7 leading-7 text-slate-600 dark:text-darkTheme-muted">
                Marque consultas, centralize dados essenciais e facilite o contato entre paciente e profissional.
              </p>
              <Link className="mt-8 inline-flex h-11 w-fit items-center rounded bg-sky px-6 font-semibold text-white transition hover:bg-mintHover" to="/profissionais">
                Saiba mais
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="acesso" className="bg-slate-50 py-16 dark:bg-darkTheme-bg">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-semibold text-sky dark:text-darkTheme-text">Acesso rápido</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {quickLinks.map(({ label, icon: Icon, to }) => (
              <Link key={label} className="group flex min-h-32 flex-col items-center justify-center gap-4 text-center text-sm font-bold text-ink transition hover:text-mint dark:text-darkTheme-text" to={to}>
                <Icon size={56} strokeWidth={1.6} className="text-slate-700 transition group-hover:text-mint dark:text-darkTheme-muted" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
