import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MapPin, LocateFixed, ArrowRight, X, Stethoscope, Star } from "lucide-react";
import { api } from "../api/client.js";
import PageLayout, { errorMessage } from "../components/PageLayout.jsx";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState(() => ({ cidade: params.get("cidade") || "", bairro: params.get("bairro") || "", uf: params.get("uf") || "", especialidadeId: params.get("especialidadeId") || "" }));
  const [specialties, setSpecialties] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");
  const [retry, setRetry] = useState(0);
  const query = params.toString();
  useEffect(() => {
    let active = true;
    api.get("/api/v1/especialidades").then(({ data }) => { if (active) setSpecialties(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    api.get("/api/v1/profissionais", { params: Object.fromEntries(new URLSearchParams(query)), signal: controller.signal })
      .then(({ data }) => setResults(data))
      .catch(err => { if (err.code !== "ERR_CANCELED") { setError(errorMessage(err)); setResults([]); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, retry]);
  function search(event) {
    event.preventDefault(); setGeoError("");
    const next = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value));
    setParams(next);
  }
  function locate() {
    setGeoError("");
    if (!navigator.geolocation) { setGeoError("Localização indisponível. Utilize os filtros de cidade e bairro."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setLocating(false); setForm({ cidade: "", bairro: "", uf: "", especialidadeId: form.especialidadeId });
      setParams({ latitude: String(position.coords.latitude), longitude: String(position.coords.longitude), raioKm: "30", ...(form.especialidadeId ? { especialidadeId: form.especialidadeId } : {}) });
    }, () => { setLocating(false); setGeoError("Não foi possível obter sua localização. Utilize os filtros de cidade e bairro."); }, { timeout: 10000 });
  }
  return <PageLayout title="Encontrar fisioterapeutas">
    <form onSubmit={search} className="grid items-end gap-4 border-b border-slate-200 pb-6 dark:border-darkTheme-border sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-medium">Cidade<input className="kx-input" maxLength={100} value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></label>
      <label className="text-sm font-medium">Bairro<input className="kx-input" maxLength={100} value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} /></label>
      <label className="text-sm font-medium"><span id="busca-estado">Estado</span><select aria-labelledby="busca-estado" className="kx-input" value={form.uf} onChange={e => setForm({ ...form, uf: e.target.value })}><option value="">Todos</option>{"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ").map(uf => <option key={uf}>{uf}</option>)}</select></label>
      <label className="text-sm font-medium"><span id="busca-especialidade">Especialidade</span><select aria-labelledby="busca-especialidade" className="kx-input" value={form.especialidadeId} onChange={e => setForm({ ...form, especialidadeId: e.target.value })}><option value="">Todas</option>{specialties.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
        <button disabled={loading} className="kx-primary"><Search size={17} />Buscar profissionais</button>
        <button disabled={locating} type="button" className="kx-secondary" onClick={locate}><LocateFixed size={17} />{locating ? "Localizando..." : "Mais próximos"}</button>
        {query && <button type="button" className="kx-link" onClick={() => { setForm({ cidade: "", bairro: "", uf: "", especialidadeId: "" }); setParams({}); setGeoError(""); }}><X size={16} />Limpar filtros</button>}
      </div>
    </form>
    {geoError && <p role="alert" className="kx-warning">{geoError}</p>}
    {params.has("latitude") && <p className="kx-muted mt-4">Profissionais em um raio de até 30 km.</p>}
    {error && <div role="alert" className="kx-error">{error} <button className="underline" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></div>}
    {loading ? <p role="status" className="py-8">Buscando profissionais...</p> : !error && <>
      <p className="kx-muted my-5">{results.length} {results.length === 1 ? "profissional encontrado" : "profissionais encontrados"}</p>
      {!results.length && <p className="py-8">Nenhum profissional encontrado. Experimente outra cidade ou especialidade.</p>}
      <ul className="kx-list">{results.map(p => <li key={p.id} className="kx-row">
        <div className="flex min-w-0 flex-1 basis-64 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"><Stethoscope size={25} /></div>
          <div className="min-w-0"><h2 className="break-words text-lg font-semibold"><Link to={`/profissionais/${p.id}`} className="hover:underline">{p.nome}</Link></h2>
            <p className="kx-muted mt-1 break-words">{p.especialidades.join(" · ") || "Fisioterapia"}</p>
            {p.demonstracao && <p className="mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300">Perfil fictício de demonstração</p>}
            {p.nomeClinica && <p className="mt-1 break-words text-sm">{p.nomeClinica}</p>}
            <p className="kx-muted mt-2 flex items-center gap-1"><MapPin size={15} className="shrink-0" /><span>{[p.bairro, p.cidade, p.uf].filter(Boolean).join(", ")}{Number.isFinite(p.distanciaKm) && p.distanciaKm != null ? ` · ${p.distanciaKm.toFixed(1)} km` : ""}</span></p>
            {p.totalAvaliacoes > 0 && <p className="kx-muted mt-1 flex items-center gap-1"><Star size={14} />{p.avaliacaoMedia.toFixed(1)} ({p.totalAvaliacoes} avaliações)</p>}
          </div>
        </div>
        <Link to={`/profissionais/${p.id}`} className="kx-secondary">Ver perfil e horários<ArrowRight size={17} /></Link>
      </li>)}</ul>
    </>}
  </PageLayout>;
}

