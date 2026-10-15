import React, { useEffect, useState } from "react";
import { Check, X, Plus, RefreshCw } from "lucide-react";
import { api } from "../api/client.js";
import PageLayout, { errorMessage } from "../components/PageLayout.jsx";

export default function AdminPage() {
  const [tab, setTab] = useState("profissionais");
  const [professionals, setProfessionals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [plan, setPlan] = useState({ nome: "", descricao: "", precoMensal: "" });
  const [specialty, setSpecialty] = useState("");
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    Promise.all([api.get("/api/v1/admin/fisioterapeutas"), api.get("/api/v1/admin/avaliacoes"), api.get("/api/v1/admin/assinaturas")])
      .then(([p, r, s]) => { if (active) { setProfessionals(p.data); setReviews(r.data); setSubscriptions(s.data); } })
      .catch(err => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  async function perform(action, success) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); setMessage(success); setRetry(n => n + 1); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  function verify(p) {
    if (!window.confirm(p.verificado ? "Revogar a verificação deste profissional?" : "Você conferiu o registro profissional e confirma a liberação?")) return;
    perform(() => api.patch(`/api/v1/admin/fisioterapeutas/${p.usuarioId}/verificacao`, { verificado: !p.verificado }), "Verificação atualizada.");
  }
  return <PageLayout title="Administração" actions={<button className="kx-icon" title="Atualizar administração" aria-label="Atualizar administração" disabled={loading || busy} onClick={() => setRetry(n => n + 1)}><RefreshCw size={18} /></button>}>
    <div className="kx-tabs flex-wrap" role="tablist" aria-label="Administração">{[["profissionais", "Profissionais"], ["avaliacoes", "Avaliações"], ["planos", "Planos"], ["especialidades", "Especialidades"]].map(([value, label]) => <button role="tab" aria-selected={tab === value} key={value} onClick={() => setTab(value)}>{label}</button>)}</div>
    {error && <p className="kx-error" role="alert">{error}</p>}{message && <p className="kx-success" role="status">{message}</p>}
    {loading ? <p className="py-6" role="status">Carregando administração...</p> : tab === "profissionais" ? <>
      <ul className="kx-list">{professionals.map(p => <li className="kx-row" key={p.usuarioId}><div className="min-w-0"><p className="break-words font-semibold">{p.nome}</p><p className="break-all kx-muted">{p.email}</p><p className="kx-muted">CREFITO {p.crefitoNumero} / {p.crefitoUf} · {p.verificado ? "Verificado" : "Pendente"}</p></div><button className="kx-secondary" disabled={busy} onClick={() => verify(p)}>{p.verificado ? <X size={17} /> : <Check size={17} />}{p.verificado ? "Revogar verificação" : "Verificar CREFITO"}</button></li>)}</ul>
      {!professionals.length && <p className="kx-muted py-5">Nenhum profissional cadastrado.</p>}
    </> : tab === "avaliacoes" ? <>
      <ul className="kx-list">{reviews.map(r => <li className="kx-row" key={r.id}><div className="min-w-0 flex-1"><p className="font-semibold">{r.profissionalNome} · {r.nota}/5</p><p className="whitespace-pre-wrap break-words my-2">{r.comentario || "Sem comentário."}</p><span className="kx-badge">{({ PENDENTE: "Pendente", APROVADA: "Aprovada", REJEITADA: "Rejeitada" })[r.status]}</span></div><div className="flex flex-wrap gap-2">{[["APROVADA", "Aprovar"], ["REJEITADA", "Rejeitar"]].map(([status, label]) => <button className="kx-secondary" key={status} disabled={busy || r.status === status} onClick={() => perform(() => api.patch(`/api/v1/admin/avaliacoes/${r.id}`, { status }), "Avaliação moderada.")}>{status === "APROVADA" ? <Check size={17} /> : <X size={17} />}{label}</button>)}</div></li>)}</ul>
      {!reviews.length && <p className="kx-muted py-5">Nenhuma avaliação enviada.</p>}
    </> : tab === "planos" ? <>
      <section className="mt-6"><h2 className="text-lg font-semibold">Cadastrar plano</h2><form className="kx-form" onSubmit={e => { e.preventDefault(); perform(async () => { await api.post("/api/v1/admin/planos-assinatura", { ...plan, precoMensal: Number(plan.precoMensal) }); setPlan({ nome: "", descricao: "", precoMensal: "" }); }, "Plano cadastrado."); }}>
        <label>Nome do plano<input className="kx-input" required maxLength={100} value={plan.nome} onChange={e => setPlan({ ...plan, nome: e.target.value })} /></label><label>Valor mensal (R$)<input className="kx-input" required type="number" min="0" max="99999999.99" step="0.01" value={plan.precoMensal} onChange={e => setPlan({ ...plan, precoMensal: e.target.value })} /></label><label className="sm:col-span-2">Benefícios<textarea className="kx-input" required maxLength={500} value={plan.descricao} onChange={e => setPlan({ ...plan, descricao: e.target.value })} /></label><div><button className="kx-primary" disabled={busy}><Plus size={17} />Cadastrar plano</button></div>
      </form></section>
      <section className="kx-section"><h2 className="text-lg font-semibold">Solicitações de assinatura</h2><ul className="kx-list">{subscriptions.map(s => <li className="kx-row" key={s.id}><div><p className="font-semibold">{s.profissionalNome}</p><p>{s.planoNome} · {s.status}</p></div>{["ATIVA", "PENDENTE"].includes(s.status) && <button className="kx-secondary" disabled={busy} onClick={() => { if (window.confirm(s.status === "PENDENTE" ? "Ativar esta solicitação manualmente? Isso não confirma pagamento." : "Cancelar esta assinatura?")) perform(() => api.patch(`/api/v1/admin/assinaturas/${s.id}`, { status: s.status === "PENDENTE" ? "ATIVA" : "CANCELADA" }), "Assinatura atualizada."); }}>{s.status === "PENDENTE" ? <Check size={17} /> : <X size={17} />}{s.status === "PENDENTE" ? "Ativar" : "Cancelar"}</button>}</li>)}</ul>{!subscriptions.length && <p className="kx-muted py-5">Nenhuma solicitação.</p>}</section>
    </> : <section className="mt-6"><h2 className="text-lg font-semibold">Cadastrar especialidade</h2><form className="kx-form" onSubmit={e => { e.preventDefault(); perform(async () => { await api.post("/api/v1/admin/especialidades", { nome: specialty.trim() }); setSpecialty(""); }, "Especialidade cadastrada."); }}><label>Nome da especialidade<input className="kx-input" required maxLength={100} value={specialty} onChange={e => setSpecialty(e.target.value)} /></label><div className="self-end"><button className="kx-primary" disabled={busy || !specialty.trim()}><Plus size={17} />Cadastrar especialidade</button></div></form></section>}
  </PageLayout>;
}
