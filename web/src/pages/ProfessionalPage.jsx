import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CalendarDays, MapPin, CheckCircle2, ArrowLeft, Stethoscope, Star } from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import PageLayout, { errorMessage, money, today } from "../components/PageLayout.jsx";

export default function ProfessionalPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [slotError, setSlotError] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [retry, setRetry] = useState(0);
  const serviceId = params.get("servico") || String(detail?.servicos[0]?.id || "");
  const day = params.get("data") || today();
  const selected = params.get("horario") || "";
  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setDetail(null); setProfileIncomplete(false);
    api.get(`/api/v1/profissionais/${id}`).then(({ data }) => { if (active) setDetail(data); })
      .catch(err => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    setSlots([]); setSlotError("");
    if (!serviceId || !day || !detail) return () => controller.abort();
    setLoadingSlots(true);
    api.get(`/api/v1/profissionais/${id}/horarios`, { params: { servicoId: serviceId, de: day, ate: day }, signal: controller.signal })
      .then(({ data }) => setSlots(data))
      .catch(err => { if (err.code !== "ERR_CANCELED") setSlotError(errorMessage(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoadingSlots(false); });
    return () => controller.abort();
  }, [id, detail, serviceId, day, retry]);
  function choose(key, value) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    if (key !== "horario") next.delete("horario");
    setParams(next, { replace: true });
    setError(""); setProfileIncomplete(false);
  }
  async function book() {
    if (!session) { navigate("/login", { state: { from: location.pathname + location.search } }); return; }
    setBusy(true); setError("");
    try {
      const { data: profile } = await api.get("/api/v1/perfil");
      if (!profile.completo) { setProfileIncomplete(true); return; }
      await api.post("/api/v1/consultas", { fisioterapeutaId: Number(id), servicoId: Number(serviceId), inicio: selected });
      navigate("/agenda");
    } catch (err) {
      setError(errorMessage(err));
      if (err.response?.status === 409) { choose("horario", ""); setRetry(n => n + 1); setError(errorMessage(err)); }
    } finally { setBusy(false); }
  }
  const p = detail?.profissional;
  const service = detail?.servicos.find(s => String(s.id) === serviceId);
  return <PageLayout title={p?.nome || "Perfil do profissional"} actions={<Link to="/profissionais" className="kx-link"><ArrowLeft size={17} />Voltar à busca</Link>}>
    {error && <p role="alert" className="kx-error">{error}</p>}
    {loading ? <p role="status">Carregando profissional...</p> : detail && <>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <section className="min-w-0">
          <div className="flex items-center gap-3"><Stethoscope size={24} /><p className="break-words font-medium">{p.especialidades.join(" · ") || "Fisioterapia"}</p></div>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-green-700 dark:text-green-300"><CheckCircle2 size={17} />Registro profissional verificado</p>
          {p.nomeClinica && <h2 className="mt-5 break-words text-lg font-semibold">{p.nomeClinica}</h2>}
          <p className="kx-muted mt-2 flex items-start gap-2"><MapPin size={18} className="shrink-0" /><span>{[p.logradouro, p.numero, p.complemento, p.bairro, p.cidade, p.uf].filter(Boolean).join(", ")}</span></p>
          {p.apresentacao && <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7">{p.apresentacao}</p>}
          <h2 className="kx-section text-lg font-semibold">Serviços</h2>
          <ul className="kx-list">{detail.servicos.map(s => <li className="py-4" key={s.id}><p className="break-words font-medium">{s.nome}</p><p className="kx-muted mt-1">{s.duracaoMinutos} min · {money(s.preco)}</p>{s.descricao && <p className="mt-2 break-words text-sm">{s.descricao}</p>}</li>)}</ul>
          {!detail.servicos.length && <p className="kx-muted mt-3">Nenhum serviço disponível no momento.</p>}
          {detail.avaliacoes.length > 0 && <section className="kx-section"><h2 className="text-lg font-semibold">Avaliações</h2>
            <ul className="kx-list">{detail.avaliacoes.map(a => <li key={a.id} className="py-4"><p className="flex items-center gap-1 text-sm"><Star size={15} />{a.nota}/5</p><p className="mt-2 break-words text-sm">{a.comentario}</p></li>)}</ul>
          </section>}
        </section>
        <section className="min-w-0 border-t border-slate-200 pt-6 dark:border-darkTheme-border lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays size={21} />Agendar consulta</h2>
          {detail.servicos.length > 0 && <div className="mt-5 space-y-5">
            <label className="block text-sm font-medium"><span id="agendar-servico">Serviço</span><select aria-labelledby="agendar-servico" className="kx-input" value={serviceId} onChange={e => choose("servico", e.target.value)}>{detail.servicos.map(s => <option key={s.id} value={s.id}>{s.nome} · {money(s.preco)}</option>)}</select></label>
            <label className="block text-sm font-medium">Data<input required type="date" min={today()} className="kx-input" value={day} onChange={e => choose("data", e.target.value)} /></label>
            <fieldset><legend className="text-sm font-medium">Horários disponíveis · Brasília</legend>
              {slotError && <div role="alert" className="kx-error">{slotError} <button type="button" className="underline" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></div>}
              {loadingSlots ? <p role="status" className="kx-muted mt-3">Consultando horários...</p> : <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map(slot => <label key={slot} className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border p-2 text-sm ${selected === slot ? "border-sky bg-green-50 text-green-900 dark:border-mint dark:bg-green-950 dark:text-green-100" : "border-slate-300 dark:border-darkTheme-border"}`}>
                  <input type="radio" name="horario" aria-label={new Date(slot).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} checked={selected === slot} onChange={() => choose("horario", slot)} />
                  {new Date(slot).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
                </label>)}
              </div>}
              {!loadingSlots && !slots.length && !slotError && <p className="kx-muted mt-3">Sem horários disponíveis nesta data. Escolha outro dia.</p>}
            </fieldset>
            {profileIncomplete && <p role="alert" className="kx-warning">Complete o endereço do seu perfil antes de agendar. <Link to="/configuracao-perfil" className="font-semibold underline">Completar perfil</Link></p>}
            {session?.perfil === "FISIO" ? <p className="kx-muted">O agendamento é exclusivo para contas de pacientes.</p> : <>
              {service && <p className="text-sm font-medium">Total: {money(service.preco)} · {service.duracaoMinutos} minutos</p>}
              <button disabled={busy || loadingSlots || !selected || !slots.includes(selected)} className="kx-primary w-full" onClick={book}>{busy ? "Reservando..." : session ? "Confirmar agendamento" : "Entrar para agendar"}</button>
            </>}
          </div>}
        </section>
      </div>
    </>}
  </PageLayout>;
}

