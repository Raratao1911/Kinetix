import React, { useEffect, useState } from 'react';
import { CalendarDays, LogOut, Activity, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Brand from "../components/Brand.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function DashboardPage() {
  const { session, logout } = useAuth();
  const fisio = session.perfil === "FISIO";
  const [consultas, setConsultas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [prescricoes, setPrescricoes] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [escalaEva, setEscalaEva] = useState(0);
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const requests = fisio
      ? [api.get("/api/v1/consultas/minhas"), api.get("/api/v1/fisioterapeuta/pacientes")]
      : [api.get("/api/v1/consultas/minhas"), api.get("/api/v1/paciente/diario-dor"), api.get("/api/v1/paciente/prescricoes")];
    Promise.all(requests).then(([agenda, dados, planos]) => {
      if (!active) return;
      setConsultas(agenda.data);
      if (fisio) setPacientes(dados.data);
      else { setRegistros(dados.data); setPrescricoes(planos.data); }
    }).catch(err => {
      if (active) setError(err.response?.data?.mensagem ?? "Não foi possível carregar sua conta.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fisio]);

  async function registrarDor(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/api/v1/paciente/diario-dor", { escalaEva: Number(escalaEva), observacao: observacao || null });
      setRegistros(current => [data, ...current]);
      setObservacao("");
    } catch (err) {
      setError(err.response?.data?.mensagem ?? "Não foi possível registrar a dor.");
    } finally { setSaving(false); }
  }

  const hoje = new Date().toLocaleDateString("pt-BR");
  const consultasHoje = consultas.filter(c => new Date(c.inicio).toLocaleDateString("pt-BR") === hoje && !c.status.startsWith("CANCELADA"));

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
            <h2 className="mt-4 text-lg font-semibold">{fisio ? "Pacientes vinculados" : "Rotinas ativas"}</h2>
            <p className="mt-1 text-3xl font-semibold">{loading ? "..." : fisio ? pacientes.length : prescricoes.length}</p>
          </article>
          <article className="rounded border border-slate-200 bg-white p-5 dark:border-darkTheme-border dark:bg-darkTheme-panel">
            <Activity className="text-mint" size={24} />
            <h2 className="mt-4 text-lg font-semibold">{fisio ? "Solicitações pendentes" : "Registros de dor"}</h2>
            <p className="mt-1 text-3xl font-semibold">{loading ? "..." : fisio ? consultas.filter(c => c.status === "SOLICITADA").length : registros.length}</p>
          </article>
          <article className="rounded border border-slate-200 bg-white p-5 dark:border-darkTheme-border dark:bg-darkTheme-panel">
            <CalendarDays className="text-mint" size={24} />
            <h2 className="mt-4 text-lg font-semibold">Consultas hoje</h2>
            <p className="mt-1 text-3xl font-semibold">{loading ? "..." : consultasHoje.length}</p>
          </article>
        </div>
        {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
        {fisio && <Link to="/prescritor" className="mt-6 inline-flex rounded bg-mint px-4 py-2 font-semibold text-ink">Prescritor digital</Link>}
        <div className="mt-8 border-t border-slate-200 pt-6 dark:border-darkTheme-border">
          <h2 className="text-lg font-semibold">Minhas consultas</h2>
          {!loading && !error && consultas.length === 0 && <p className="mt-2 text-slate-500 dark:text-darkTheme-muted">Nenhuma consulta cadastrada.</p>}
          <ul className="mt-3 divide-y divide-slate-200 dark:divide-darkTheme-border">
            {consultas.map(c => <li key={c.id} className="flex flex-wrap justify-between gap-2 py-3">
              <div><p className="font-medium">{fisio ? c.pacienteNome : c.fisioterapeutaNome}</p><p className="text-sm">{c.servicoNome} - {new Date(c.inicio).toLocaleString("pt-BR")}</p></div>
              <span className="text-sm">{c.status.replaceAll("_", " ")}</span>
            </li>)}
          </ul>
        </div>
        {!fisio && <>
          <form onSubmit={registrarDor} className="mt-8 border-t border-slate-200 pt-6 dark:border-darkTheme-border">
            <h2 className="text-lg font-semibold">Diário de dor</h2>
            <label className="mt-4 block">Intensidade: {escalaEva}/10
              <input type="range" min="0" max="10" value={escalaEva} onChange={e => setEscalaEva(e.target.value)} className="mt-2 block w-full max-w-md" />
            </label>
            <label className="mt-4 block">Observação
              <textarea maxLength={4000} value={observacao} onChange={e => setObservacao(e.target.value)} className="mt-2 block w-full max-w-xl rounded border border-slate-300 bg-white p-3 dark:border-darkTheme-border dark:bg-darkTheme-surface" />
            </label>
            <button disabled={saving || loading} className="mt-3 rounded bg-mint px-4 py-2 font-semibold text-ink disabled:opacity-60">{saving ? "Salvando..." : "Registrar"}</button>
          </form>
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-darkTheme-border">{registros.map(r => <li key={r.id} className="py-3"><p>{new Date(r.registradoEm).toLocaleString("pt-BR")} - {r.escalaEva}/10</p><p className="break-words text-sm">{r.observacao}</p></li>)}</ul>
          <h2 className="mt-8 text-lg font-semibold">Minhas rotinas</h2>
          {!loading && !error && prescricoes.length === 0 && <p className="mt-2 text-slate-500 dark:text-darkTheme-muted">Nenhuma rotina prescrita.</p>}
          {prescricoes.map(p => <article key={p.id} className="mt-4 border-t border-slate-200 py-4 dark:border-darkTheme-border">
            <h3 className="font-semibold">{p.titulo}</h3><p className="break-words text-sm">{p.orientacoes}</p>
            <ul className="mt-2 space-y-2">{p.itens.map(i => <li key={i.id} className="text-sm">{i.exercicioNome}: {i.series ?? "-"} séries, {i.repeticoes ?? "-"} repetições{i.duracaoSegundos ? `, ${i.duracaoSegundos}s` : ""}<p>{i.orientacoes}</p></li>)}</ul>
          </article>)}
        </>}
      </section>
    </main>
  );
}

