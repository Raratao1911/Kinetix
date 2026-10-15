import React, { useEffect, useState } from "react";
import { Save, Plus, Pencil, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { errorMessage, money } from "./PageLayout.jsx";

const emptyService = { nome: "", descricao: "", duracaoMinutos: 50, preco: "" };
export default function ProfessionalSettings() {
  const [tab, setTab] = useState("perfil");
  const [profile, setProfile] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [selected, setSelected] = useState([]);
  const [services, setServices] = useState([]);
  const [service, setService] = useState(emptyService);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([api.get("/api/v1/fisioterapeuta/perfil"), api.get("/api/v1/especialidades"), api.get("/api/v1/fisioterapeuta/servicos")])
      .then(([p, e, s]) => {
        if (!active) return;
        setProfile({ ...p.data, latitude: p.data.latitude ?? "", longitude: p.data.longitude ?? "" });
        setSpecialties(e.data);
        setSelected(e.data.filter(item => p.data.especialidades.includes(item.nome)).map(item => item.id));
        setServices(s.data);
        setError("");
      }).catch(err => { if (active) setError(errorMessage(err)); });
    return () => { active = false; };
  }, [retry]);

  async function perform(action) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  function saveProfile(event) {
    event.preventDefault();
    perform(async () => {
      const { data } = await api.put("/api/v1/fisioterapeuta/perfil", {
        nomeClinica: profile.nomeClinica || "", apresentacao: profile.apresentacao || "",
        latitude: profile.latitude === "" ? null : Number(profile.latitude),
        longitude: profile.longitude === "" ? null : Number(profile.longitude)
      });
      setProfile(current => ({ ...current, ...data, latitude: data.latitude ?? "", longitude: data.longitude ?? "" }));
      setMessage("Apresentação profissional salva.");
    });
  }
  function saveSpecialties(event) {
    event.preventDefault();
    perform(async () => {
      const { data } = await api.put("/api/v1/fisioterapeuta/especialidades", { especialidadesIds: selected });
      setProfile(current => ({ ...current, especialidades: data.especialidades }));
      setMessage("Especialidades salvas.");
    });
  }
  function saveService(event) {
    event.preventDefault();
    perform(async () => {
      const payload = { ...service, preco: Number(service.preco), duracaoMinutos: Number(service.duracaoMinutos) };
      if (editing) await api.put(`/api/v1/fisioterapeuta/servicos/${editing}`, payload);
      else await api.post("/api/v1/fisioterapeuta/servicos", payload);
      setServices((await api.get("/api/v1/fisioterapeuta/servicos")).data);
      setEditing(null); setService(emptyService); setMessage("Serviço salvo.");
    });
  }
  function removeService(item) {
    if (!window.confirm(`Desativar o serviço "${item.nome}"? As consultas existentes serão preservadas.`)) return;
    perform(async () => {
      await api.delete(`/api/v1/fisioterapeuta/servicos/${item.id}`);
      setServices(current => current.filter(s => s.id !== item.id));
      if (editing === item.id) { setEditing(null); setService(emptyService); }
      setMessage("Serviço desativado.");
    });
  }
  return <section className="kx-workspace mt-10 border-t border-slate-200 pt-7 dark:border-darkTheme-border">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">Atendimento profissional</h2>
      <Link to="/agenda?aba=disponibilidade" className="kx-link">Configurar horários</Link>
    </div>
    {error && <p role="alert" className="kx-error">{error}</p>}
    {message && <p role="status" className="kx-success">{message}</p>}
    {!profile ? <button type="button" className="kx-secondary mt-4" onClick={() => setRetry(n => n + 1)}>Carregar dados profissionais</button> : <>
      <p className={profile.crefitoVerificado ? "kx-success" : "kx-warning"}>
        {profile.crefitoVerificado ? "CREFITO verificado." : "CREFITO aguardando verificação administrativa. Seu perfil ainda não aparece na busca pública."}
      </p>
      <div role="tablist" aria-label="Atendimento profissional" className="kx-tabs">
        {[["perfil", "Apresentação"], ["especialidades", "Especialidades"], ["servicos", "Serviços e preços"]].map(([key, label]) =>
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => { setTab(key); setMessage(""); setError(""); }}>{label}</button>)}
      </div>
      <div role="tabpanel">
      {tab === "perfil" && <form onSubmit={saveProfile} className="kx-form">
        <label>Nome da clínica<input className="kx-input" maxLength={160} value={profile.nomeClinica || ""} onChange={e => setProfile({ ...profile, nomeClinica: e.target.value })} /></label>
        <label className="sm:col-span-2"><span id="profissional-apresentacao">Apresentação</span><textarea aria-labelledby="profissional-apresentacao" className="kx-input" rows={4} maxLength={1200} value={profile.apresentacao || ""} onChange={e => setProfile({ ...profile, apresentacao: e.target.value })} /></label>
        <label>Latitude (opcional)<input className="kx-input" type="number" min="-90" max="90" step="any" value={profile.latitude} onChange={e => setProfile({ ...profile, latitude: e.target.value })} /></label>
        <label>Longitude (opcional)<input className="kx-input" type="number" min="-180" max="180" step="any" value={profile.longitude} onChange={e => setProfile({ ...profile, longitude: e.target.value })} /></label>
        <div className="sm:col-span-2"><button disabled={busy} className="kx-primary"><Save size={17} />Salvar apresentação</button></div>
      </form>}
      {tab === "especialidades" && <form onSubmit={saveSpecialties} className="py-5">
        <div className="grid gap-3 sm:grid-cols-2">{specialties.map(item => <label key={item.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={selected.includes(item.id)} onChange={e => setSelected(e.target.checked ? [...selected, item.id] : selected.filter(id => id !== item.id))} />{item.nome}
        </label>)}</div>
        {!specialties.length && <p>Nenhuma especialidade disponível.</p>}
        <button disabled={busy} className="kx-primary mt-5"><Save size={17} />Salvar especialidades</button>
      </form>}
      {tab === "servicos" && <>
        <ul className="kx-list">{services.map(item => <li key={item.id} className="kx-row">
          <div className="min-w-0"><p className="break-words font-semibold">{item.nome}</p><p className="kx-muted">{item.duracaoMinutos} min · {money(item.preco)}</p></div>
          <div className="flex gap-2">
            <button disabled={busy} type="button" title="Editar serviço" aria-label={`Editar ${item.nome}`} className="kx-icon" onClick={() => { setEditing(item.id); setService(item); }}><Pencil size={17} /></button>
            <button disabled={busy} type="button" title="Desativar serviço" aria-label={`Desativar ${item.nome}`} className="kx-icon text-red-600" onClick={() => removeService(item)}><Trash2 size={17} /></button>
          </div>
        </li>)}</ul>
        {!services.length && <p className="kx-muted my-5">Nenhum serviço cadastrado.</p>}
        <form onSubmit={saveService} className="kx-form border-t border-slate-200 pt-5 dark:border-darkTheme-border">
          <h3 className="font-semibold sm:col-span-2">{editing ? "Editar serviço" : "Novo serviço"}</h3>
          <label>Nome do serviço<input required maxLength={120} className="kx-input" value={service.nome} onChange={e => setService({ ...service, nome: e.target.value })} /></label>
          <label>Duração (minutos)<input required type="number" min={10} max={480} className="kx-input" value={service.duracaoMinutos} onChange={e => setService({ ...service, duracaoMinutos: e.target.value })} /></label>
          <label>Preço (R$)<input required type="number" min="0" step="0.01" className="kx-input" value={service.preco} onChange={e => setService({ ...service, preco: e.target.value })} /></label>
          <label>Descrição<input maxLength={500} className="kx-input" value={service.descricao || ""} onChange={e => setService({ ...service, descricao: e.target.value })} /></label>
          <div className="flex gap-3 sm:col-span-2">
            <button disabled={busy} className="kx-primary">{editing ? <Save size={17} /> : <Plus size={17} />}Salvar serviço</button>
            {editing && <button type="button" className="kx-secondary" onClick={() => { setEditing(null); setService(emptyService); }}><X size={17} />Cancelar edição</button>}
          </div>
        </form>
      </>}
      </div>
    </>}
  </section>;
}

