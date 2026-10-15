import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import PageLayout, { money, errorMessage } from "../components/PageLayout.jsx";

export default function PlansPage() {
  const { session } = useAuth();
  const fisio = session?.perfil === "FISIO";
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([api.get("/api/v1/planos-assinatura"), fisio ? api.get("/api/v1/fisioterapeuta/assinaturas") : Promise.resolve({ data: [] })])
      .then(([p, s]) => { if (active) { setPlans(p.data); setSubscriptions(s.data); } })
      .catch(err => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fisio]);
  async function change(plan, subscription) {
    if (subscription && !window.confirm("Cancelar esta assinatura?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (subscription) await api.delete(`/api/v1/fisioterapeuta/assinaturas/${subscription.id}`);
      else await api.post("/api/v1/fisioterapeuta/assinaturas", null, { params: { planoId: plan.id } });
      setSubscriptions((await api.get("/api/v1/fisioterapeuta/assinaturas")).data);
      setMessage(subscription ? "Assinatura cancelada." : "Solicitação registrada. Aguarde a análise administrativa.");
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  const current = subscriptions.find(s => ["ATIVA", "PENDENTE"].includes(s.status));
  return <PageLayout title="Planos para profissionais">
    <p className="kx-muted">A escolha é opcional. Solicitar um plano não realiza cobrança automática.</p>
    {error && <p className="kx-error" role="alert">{error}</p>}
    {message && <p className="kx-success" role="status">{message}</p>}
    {loading ? <p role="status" className="py-6">Carregando planos...</p> : <>
      {!plans.length && <p className="py-6 kx-muted">Nenhum plano disponível no momento.</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-3">{plans.map(plan => <article className="rounded border border-slate-200 p-5 dark:border-darkTheme-border" key={plan.id}>
        <h2 className="break-words text-lg font-semibold">{plan.nome}</h2>
        <p className="my-4 text-2xl font-semibold">{money(plan.precoMensal)}<span className="text-sm font-normal"> / mês</span></p>
        <p className="mb-5 whitespace-pre-wrap break-words kx-muted">{plan.descricao}</p>
        {fisio ? <button className="kx-primary" disabled={busy || !!current} onClick={() => change(plan)}><Check size={17} />{current?.planoId === plan.id ? "Plano selecionado" : "Solicitar plano"}</button>
          : !session ? <Link className="kx-primary" to="/cadastro?perfil=FISIO">Cadastrar como profissional</Link> : null}
      </article>)}</div>
      {fisio && <section className="kx-section"><h2 className="text-lg font-semibold">Minhas assinaturas</h2>
        {!subscriptions.length && <p className="kx-muted mt-3">Nenhuma assinatura solicitada.</p>}
        <ul className="kx-list">{subscriptions.map(s => <li key={s.id} className="kx-row"><div><p className="font-semibold">{s.planoNome}</p><p className="kx-muted">{({ ATIVA: "Ativa", PENDENTE: "Pendente", CANCELADA: "Cancelada", EXPIRADA: "Expirada" })[s.status]} · {s.inicio.split("-").reverse().join("/")}</p></div>
          {["ATIVA", "PENDENTE"].includes(s.status) && <button className="kx-secondary" disabled={busy} onClick={() => change(null, s)}><X size={17} />Cancelar assinatura</button>}</li>)}</ul>
      </section>}
    </>}
  </PageLayout>;
}
