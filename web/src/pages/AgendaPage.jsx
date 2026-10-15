import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Plus, Trash2, Check, X, RefreshCw, UserRound, CheckCheck } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import PageLayout, { dateTime, money, today, errorMessage, statusLabel } from "../components/PageLayout.jsx";

const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
export default function AgendaPage() {
  const { session } = useAuth();
  const fisio = session.perfil === "FISIO";
  const [params, setParams] = useSearchParams();
  const tab = fisio && params.get("aba") === "disponibilidade" ? "disponibilidade" : "consultas";
  const [consultas, setConsultas] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [scope, setScope] = useState("proximas");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancel, setCancel] = useState(null);
  const [reason, setReason] = useState("");
  const cancelDialog = useRef(null);
  useEffect(() => { if (cancel && cancelDialog.current && !cancelDialog.current.open) cancelDialog.current.showModal(); }, [cancel]);
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState({ diaSemana: "1", horaInicio: "08:00", horaFim: "18:00", vigenciaInicio: today(), vigenciaFim: "" });
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    Promise.all([api.get("/api/v1/consultas/minhas"), fisio ? api.get("/api/v1/fisioterapeuta/disponibilidades") : Promise.resolve({ data: [] })])
      .then(([c, d]) => { if (active) { setConsultas(c.data); setAvailability(d.data); } })
      .catch(err => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fisio, retry]);
  async function perform(action, success) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); setMessage(success); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  function act(consulta, action) {
    if (action === "concluir" && !window.confirm("Concluir este atendimento?")) return;
    perform(async () => {
      const { data } = action === "confirmar"
        ? await api.post(`/api/v1/fisioterapeuta/consultas/${consulta.id}/confirmar`)
        : await api.patch(`/api/v1/consultas/${consulta.id}/concluir`);
      setConsultas(current => current.map(item => item.id === data.id ? data : item));
    }, action === "confirmar" ? "Consulta confirmada." : "Atendimento concluído.");
  }
  function cancelAppointment(event) {
    event.preventDefault();
    perform(async () => {
      const { data } = await api.patch(`/api/v1/consultas/${cancel.id}/cancelar`, { motivo: reason.trim() });
      setConsultas(current => current.map(item => item.id === data.id ? data : item));
      setCancel(null); setReason("");
    }, "Consulta cancelada.");
  }
  function addAvailability(event) {
    event.preventDefault();
    if (form.horaFim <= form.horaInicio) { setError("O horário final deve ser posterior ao inicial."); return; }
    perform(async () => {
      await api.post("/api/v1/fisioterapeuta/disponibilidades", { ...form, diaSemana: Number(form.diaSemana), vigenciaFim: form.vigenciaFim || null });
      setAvailability((await api.get("/api/v1/fisioterapeuta/disponibilidades")).data);
    }, "Disponibilidade publicada.");
  }
  function removeAvailability(item) {
    if (!window.confirm("Remover esta disponibilidade? As consultas existentes serão preservadas.")) return;
    perform(async () => {
      await api.delete(`/api/v1/fisioterapeuta/disponibilidades/${item.id}`);
      setAvailability(current => current.filter(d => d.id !== item.id));
    }, "Disponibilidade removida.");
  }
  const activeStatus = status => ["SOLICITADA", "CONFIRMADA"].includes(status);
  const filtered = consultas.filter(c => scope === "todas" || (scope === "proximas"
    ? activeStatus(c.status) && new Date(c.inicio) >= new Date(today() + "T00:00:00-03:00")
    : !activeStatus(c.status) || new Date(c.inicio) < new Date(today() + "T00:00:00-03:00")))
    .sort((a, b) => scope === "proximas" ? new Date(a.inicio) - new Date(b.inicio) : new Date(b.inicio) - new Date(a.inicio));
  return <PageLayout title={fisio ? "Agenda de atendimentos" : "Minhas consultas"} actions={<button className="kx-icon" title="Atualizar agenda" aria-label="Atualizar agenda" disabled={loading || busy} onClick={() => setRetry(n => n + 1)}><RefreshCw size={18} /></button>}>
    {fisio && <div className="kx-tabs" role="tablist" aria-label="Agenda">
      <button role="tab" aria-selected={tab === "consultas"} onClick={() => setParams({})}>Consultas</button>
      <button role="tab" aria-selected={tab === "disponibilidade"} onClick={() => setParams({ aba: "disponibilidade" })}>Disponibilidade</button>
    </div>}
    {error && <p role="alert" className="kx-error">{error}</p>}
    {message && <p role="status" className="kx-success">{message}</p>}
    {loading ? <p role="status" className="py-6">Carregando agenda...</p> : tab === "disponibilidade" ? <>
      <h2 className="mt-6 text-lg font-semibold">Horários publicados</h2>
      <ul className="kx-list">{availability.map(item => <li key={item.id} className="kx-row">
        <div><p className="font-semibold">{days[item.diaSemana - 1]} · {item.horaInicio.slice(0, 5)}–{item.horaFim.slice(0, 5)}</p>
          <p className="kx-muted">De {item.vigenciaInicio.split("-").reverse().join("/")} {item.vigenciaFim ? `até ${item.vigenciaFim.split("-").reverse().join("/")}` : "em diante"}</p></div>
        <button disabled={busy} title="Remover disponibilidade" aria-label={`Remover disponibilidade ${item.id}`} className="kx-icon text-red-600" onClick={() => removeAvailability(item)}><Trash2 size={17} /></button>
      </li>)}</ul>
      {!availability.length && <p className="kx-muted py-5">Nenhum horário publicado.</p>}
      <section className="kx-section"><h2 className="text-lg font-semibold">Publicar disponibilidade</h2>
        <form onSubmit={addAvailability} className="kx-form">
          <label><span id="disponibilidade-dia">Dia da semana</span><select aria-labelledby="disponibilidade-dia" className="kx-input" value={form.diaSemana} onChange={e => setForm({ ...form, diaSemana: e.target.value })}>{days.map((day, i) => <option value={i + 1} key={day}>{day}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label>Início<input required type="time" className="kx-input" value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })} /></label>
            <label>Fim<input required type="time" className="kx-input" value={form.horaFim} onChange={e => setForm({ ...form, horaFim: e.target.value })} /></label>
          </div>
          <label>Válido a partir de<input required type="date" className="kx-input" value={form.vigenciaInicio} onChange={e => setForm({ ...form, vigenciaInicio: e.target.value })} /></label>
          <label>Válido até (opcional)<input type="date" min={form.vigenciaInicio} className="kx-input" value={form.vigenciaFim} onChange={e => setForm({ ...form, vigenciaFim: e.target.value })} /></label>
          <div className="sm:col-span-2"><button disabled={busy} className="kx-primary"><Plus size={17} />Publicar horários</button></div>
        </form>
      </section>
    </> : <>
      <div className="my-5 flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm font-medium"><span id="agenda-exibir">Exibir</span><select aria-labelledby="agenda-exibir" className="kx-input" value={scope} onChange={e => setScope(e.target.value)}><option value="proximas">Próximas consultas</option><option value="historico">Histórico de sessões</option><option value="todas">Todas as consultas</option></select></label>
        {!fisio && <Link to="/profissionais" className="kx-primary"><Plus size={17} />Agendar consulta</Link>}
      </div>
      {!filtered.length && <p className="kx-muted py-8">Nenhuma consulta neste período.</p>}
      <ul className="kx-list">{filtered.map(c => {
        const active = activeStatus(c.status);
        const canCancel = fisio || new Date(c.inicio) - Date.now() >= 24 * 60 * 60 * 1000;
        return <li key={c.id} className="kx-row">
          <div className="min-w-0 flex-1 basis-60">
            <p className="break-words font-semibold">{fisio ? c.pacienteNome : c.fisioterapeutaNome}</p>
            <p className="mt-1 break-words text-sm">{c.servicoNome} · {money(c.preco)}</p>
            <p className="kx-muted mt-1">{dateTime(c.inicio)} · horário de Brasília</p>
            <span className="kx-badge mt-2">{statusLabel(c.status)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {fisio && (active || ["REALIZADA", "FALTOU"].includes(c.status)) && <Link className="kx-secondary" to={`/pacientes/${c.pacienteId}`}><UserRound size={17} />Paciente</Link>}
            {fisio && c.status === "SOLICITADA" && <button className="kx-primary" disabled={busy} onClick={() => act(c, "confirmar")}><Check size={17} />Confirmar</button>}
            {fisio && c.status === "CONFIRMADA" && <button className="kx-primary" disabled={busy} onClick={() => act(c, "concluir")}><CheckCheck size={17} />Concluir</button>}
            {active && <button className="kx-secondary" disabled={busy || !canCancel} title={!canCancel ? "Cancelamento permitido com pelo menos 24 horas de antecedência." : "Cancelar consulta"} onClick={() => { setCancel(c); setReason(""); }}><X size={17} />Cancelar</button>}
          </div>
        </li>;
      })}</ul>
      {!fisio && <p className="kx-muted mt-5">Cancelamentos pelo paciente exigem pelo menos 24 horas de antecedência.</p>}
    </>}
    {cancel && <dialog ref={cancelDialog} aria-labelledby="cancel-title" onCancel={event => { if (busy) event.preventDefault(); else setCancel(null); }} className="w-[90vw] max-w-lg rounded border-0 bg-white p-6 text-ink shadow-lg backdrop:bg-black/50 dark:bg-darkTheme-panel dark:text-darkTheme-text">
        <h2 id="cancel-title" className="text-lg font-semibold">Cancelar consulta</h2>
        <p className="kx-muted mt-2">{dateTime(cancel.inicio)} · {cancel.servicoNome}</p>
        <form onSubmit={cancelAppointment}>
          <label className="mt-4 block text-sm font-medium"><span id="cancel-motivo">Motivo</span><textarea aria-labelledby="cancel-motivo" autoFocus required maxLength={500} rows={4} className="kx-input" value={reason} onChange={e => setReason(e.target.value)} /></label>
          {error && <p role="alert" className="kx-error">{error}</p>}
          <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy || !reason.trim()} className="kx-primary">Confirmar cancelamento</button><button type="button" disabled={busy} onClick={() => setCancel(null)} className="kx-secondary">Voltar</button></div>
        </form>
    </dialog>}
  </PageLayout>;
}

