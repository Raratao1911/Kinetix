import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Save, ClipboardList, ArrowLeft, Pencil } from "lucide-react";
import { api } from "../api/client.js";
import PageLayout, { dateTime, errorMessage, statusLabel } from "../components/PageLayout.jsx";

export default function PatientPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [pain, setPain] = useState([]);
  const [consultation, setConsultation] = useState("");
  const [text, setText] = useState("");
  const [tab, setTab] = useState("historico");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setPatient(null); setRecords([]); setPain([]); setText(""); setConsultation(""); setMessage("");
    Promise.all([
      api.get("/api/v1/fisioterapeuta/pacientes"), api.get("/api/v1/consultas/minhas"),
      api.get(`/api/v1/fisioterapeuta/pacientes/${id}/prontuarios`),
      api.get(`/api/v1/fisioterapeuta/pacientes/${id}/diario-dor`)
    ]).then(([patients, c, r, d]) => {
      if (!active) return;
      const person = patients.data.find(p => String(p.usuarioId) === id);
      if (!person) throw new Error("Paciente não encontrado nos seus atendimentos.");
      setPatient(person); setAppointments(c.data.filter(item => String(item.pacienteId) === id));
      setRecords(r.data); setPain(d.data);
    }).catch(err => { if (active) setError(err.response ? errorMessage(err) : err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);
  function selectConsultation(value) {
    setConsultation(value); setText(records.find(r => String(r.consultaId) === value)?.registroClinico || ""); setMessage("");
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const { data } = await api.put(`/api/v1/fisioterapeuta/consultas/${consultation}/prontuario`, { registroClinico: text.trim() });
      setRecords(current => [data, ...current.filter(r => r.consultaId !== data.consultaId)]);
      setMessage("Prontuário salvo."); setText(data.registroClinico);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  const eligible = appointments.filter(c => !c.status.startsWith("CANCELADA"));
  return <PageLayout title={patient?.nome || "Detalhes do paciente"} actions={<Link to="/agenda" className="kx-link"><ArrowLeft size={17} />Voltar à agenda</Link>}>
    {error && <p role="alert" className="kx-error">{error}</p>}
    {message && <p role="status" className="kx-success">{message}</p>}
    {loading ? <p role="status">Carregando paciente...</p> : !patient ? <button className="kx-secondary" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button> : <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0"><p className="kx-muted break-words">{patient.email}</p><p className="kx-muted mt-1">{[patient.cidade, patient.uf].filter(Boolean).join(" · ")}{patient.telefone ? ` · ${patient.telefone}` : ""}</p></div>
        <Link to={`/prescritor?paciente=${id}`} className="kx-primary"><ClipboardList size={17} />Prescrever exercícios</Link>
      </div>
      <div className="kx-tabs" role="tablist" aria-label="Dados do paciente">{[["historico", "Histórico"], ["prontuario", "Prontuário"], ["dor", "Diário de dor"]].map(([key, label]) =>
        <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
      <section role="tabpanel" className="py-5">
        {tab === "historico" && <>
          <h2 className="text-lg font-semibold">Histórico de atendimentos</h2>
          {!appointments.length && <p className="kx-muted py-5">Nenhum atendimento registrado.</p>}
          <ul className="kx-list">{appointments.map(c => <li className="kx-row" key={c.id}><div className="min-w-0"><p className="break-words font-medium">{c.servicoNome}</p><p className="kx-muted mt-1">{dateTime(c.inicio)}</p></div><span className="kx-badge">{statusLabel(c.status)}</span></li>)}</ul>
        </>}
        {tab === "dor" && <>
          <h2 className="text-lg font-semibold">Registros de dor</h2>
          {!pain.length && <p className="kx-muted py-5">O paciente ainda não registrou seu diário de dor.</p>}
          <ul className="kx-list">{pain.map(r => <li key={r.id} className="py-4"><p className="font-medium">{r.escalaEva}/10 · {dateTime(r.registradoEm)}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.observacao || "Sem observação."}</p></li>)}</ul>
        </>}
        {tab === "prontuario" && <>
          <h2 className="text-lg font-semibold">Registro clínico</h2>
          <form onSubmit={save} className="mt-4 space-y-4">
            <label className="block text-sm font-medium"><span id="prontuario-consulta">Atendimento</span><select aria-labelledby="prontuario-consulta" className="kx-input" required value={consultation} onChange={e => selectConsultation(e.target.value)}>
              <option value="">Selecione um atendimento</option>{eligible.map(c => <option key={c.id} value={c.id}>{dateTime(c.inicio)} · {c.servicoNome}</option>)}
            </select></label>
            <label className="block text-sm font-medium"><span id="prontuario-registro">Registro clínico</span><textarea aria-labelledby="prontuario-registro" className="kx-input" required maxLength={12000} rows={7} value={text} onChange={e => setText(e.target.value)} /></label>
            <button disabled={busy || !consultation || !text.trim()} className="kx-primary"><Save size={17} />{busy ? "Salvando..." : "Salvar prontuário"}</button>
          </form>
          <h3 className="kx-section font-semibold">Registros anteriores</h3>
          {!records.length && <p className="kx-muted mt-4">Nenhum prontuário registrado por você.</p>}
          <ul className="kx-list">{records.map(r => <li key={r.id} className="py-4">
            <div className="flex items-center justify-between gap-3"><p className="kx-muted">{dateTime(r.atualizadoEm)}</p>
              <button type="button" title="Editar registro" aria-label="Editar registro" className="kx-icon" onClick={() => { setConsultation(String(r.consultaId)); setText(r.registroClinico); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={17} /></button>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.registroClinico}</p>
          </li>)}</ul>
        </>}
      </section>
    </>}
  </PageLayout>;
}

