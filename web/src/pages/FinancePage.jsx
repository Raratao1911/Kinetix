import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import PageLayout, { money, today, dateTime, statusLabel, errorMessage } from "../components/PageLayout.jsx";

export default function FinancePage() {
  const [consultas, setConsultas] = useState([]);
  const [start, setStart] = useState(today().slice(0, 7) + "-01");
  const [end, setEnd] = useState(today());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.get("/api/v1/consultas/minhas").then(({ data }) => { if (active) setConsultas(data); })
      .catch(err => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const valid = start && end && start <= end;
  const filtered = valid ? consultas.filter(c => {
    const day = new Date(c.inicio).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    return day >= start && day <= end;
  }) : [];
  const completed = filtered.filter(c => c.status === "REALIZADA");
  const expected = filtered.filter(c => ["SOLICITADA", "CONFIRMADA"].includes(c.status));
  const total = list => list.reduce((sum, c) => sum + Math.round(Number(c.preco) * 100), 0) / 100;
  return <PageLayout title="Financeiro">
    <div className="flex flex-wrap gap-4"><label>De<input className="kx-input" required type="date" value={start} onChange={e => setStart(e.target.value)} /></label><label>Até<input className="kx-input" required min={start} type="date" value={end} onChange={e => setEnd(e.target.value)} /></label></div>
    {!valid && <p className="kx-error" role="alert">Informe um período válido.</p>}
    {error && <p className="kx-error" role="alert">{error}</p>}
    {loading ? <p className="py-6" role="status">Carregando financeiro...</p> : <>
      <dl className="my-7 grid gap-5 sm:grid-cols-3">{[["Atendimentos realizados", money(total(completed))], ["Valor previsto", money(total(expected))], ["Sessões realizadas", completed.length]].map(([label, value]) => <div key={label} className="border-l-4 border-emerald-500 pl-4"><dt className="kx-muted">{label}</dt><dd className="mt-2 break-words text-2xl font-semibold">{value}</dd></div>)}</dl>
      <p className="kx-muted">Valores dos serviços nas consultas, não comprovantes de pagamento. Cancelamentos e faltas não entram no total realizado.</p>
      <section className="kx-section"><h2 className="text-lg font-semibold">Atendimentos no período</h2>
        {!filtered.length && <p className="kx-muted py-5">Nenhum atendimento neste período.</p>}
        <ul className="kx-list">{filtered.map(c => <li key={c.id} className="kx-row"><div><p className="break-words font-semibold">{c.pacienteNome}</p><p className="kx-muted">{dateTime(c.inicio)} · {c.servicoNome}</p></div><div><p className="font-semibold">{money(c.preco)}</p><p className="kx-muted">{statusLabel(c.status)}</p></div></li>)}</ul>
      </section>
    </>}
  </PageLayout>;
}
