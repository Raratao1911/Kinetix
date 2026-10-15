import React, { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Upload, Trash2, UserRound, AlertCircle, RefreshCw } from "lucide-react";
import { isSupportedCountry, parsePhoneNumberFromString } from "libphonenumber-js";
import { api } from "../api/client.js";
import Brand from "../components/Brand.jsx";
import ProfessionalSettings from "../components/ProfessionalSettings.jsx";
import PhoneFields, { phoneToInternational } from "../components/PhoneFields.jsx";
import { useAuth } from "../state/AuthContext.jsx";

const fieldClass = "mt-1 h-11 w-full rounded border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-sky dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-darkTheme-text";
const states = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

function toForm(data) {
  const phone = data.telefoneAdicional ? parsePhoneNumberFromString(data.telefoneAdicional) : null;
  return {
    cep: (data.cep || "").replace(/\D/g, ""), logradouro: data.logradouro || "", numero: data.numero || "",
    cidade: data.cidade || "", bairro: data.bairro || "", uf: data.uf || "",
    telefoneAdicional: phone?.nationalNumber || "",
    paisTelefoneAdicional: isSupportedCountry(data.paisTelefoneAdicional || "") ? data.paisTelefoneAdicional : phone?.country || "BR"
  };
}

async function preparePhoto(file) {
  if (!["image/jpeg", "image/png"].includes(file.type)) throw new Error("Escolha uma foto JPEG ou PNG.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Escolha uma foto de até 8 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("Não foi possível preparar a foto.");
    return new File([blob], "perfil.jpg", { type: "image/jpeg" });
  } finally { bitmap.close(); }
}

export default function ProfilePage() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const { data } = await api.get("/api/v1/perfil");
        const image = data.fotoDisponivel ? (await api.get("/api/v1/perfil/foto", { responseType: "blob" })).data : null;
        if (active) { setProfile(data); setForm(toForm(data)); setPhoto(image); }
      } catch (err) {
        if (active) setError(err.response?.data?.mensagem || "Não foi possível carregar o perfil.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [retry, session.usuarioId]);

  useEffect(() => {
    const source = photoFile || (!removePhoto ? photo : null);
    const url = source ? URL.createObjectURL(source) : "";
    setPreview(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [photo, photoFile, removePhoto]);

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }));
    setMessage("");
  }

  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPreparing(true);
    setError("");
    setMessage("");
    try { setPhotoFile(await preparePhoto(file)); setRemovePhoto(false); }
    catch (err) { setError(err instanceof DOMException ? "Não foi possível ler a foto. Escolha uma imagem válida." : err.message || "Não foi possível ler a foto."); }
    finally { setPreparing(false); }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const phone = phoneToInternational(form.telefoneAdicional, form.paisTelefoneAdicional);
      const payload = { ...form, cep: form.cep || null, logradouro: form.logradouro.trim() || null,
        numero: form.numero.trim() || null, bairro: form.bairro.trim() || null,
        telefoneAdicional: phone, paisTelefoneAdicional: phone ? form.paisTelefoneAdicional : null, removerFoto: removePhoto };
      const body = new FormData();
      body.append("dados", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      if (photoFile) body.append("foto", photoFile);
      const { data } = await api.put("/api/v1/perfil", body);
      setProfile(data);
      setForm(toForm(data));
      setPhoto(photoFile || (removePhoto ? null : photo));
      setPhotoFile(null);
      setRemovePhoto(false);
      setMessage(data.completo ? "Perfil salvo. Seu endereço está completo." : "Dados salvos. Complete o endereço para finalizar o perfil.");
    } catch (err) {
      setError(err.response?.data?.mensagem || err.message || "Não foi possível salvar o perfil.");
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-ink dark:bg-darkTheme-bg dark:text-darkTheme-text">
      <header className="border-b border-slate-200 bg-sky text-white dark:border-darkTheme-border dark:bg-darkTheme-panel">
        <div className="mx-auto flex min-h-36 max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-2">
          <Brand />
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium"><ArrowLeft size={17} />Minha conta</Link>
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="text-2xl font-semibold">Configuração de perfil</h1>
        <p className="mt-1 break-words text-slate-600 dark:text-darkTheme-muted">{profile?.nome || session.nome}</p>
        {error && <p role="alert" className="mt-4 text-red-600 dark:text-red-400">{error}</p>}
        {message && <p role="status" className="mt-4 text-green-700 dark:text-green-400">{message}</p>}
        {loading && <p role="status" className="mt-6">Carregando perfil...</p>}
        {!loading && !form && <button onClick={() => setRetry(value => value + 1)} className="mt-4 inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2"><RefreshCw size={17} />Tentar novamente</button>}
        {!loading && form && <>
          {!profile.completo && <div className="mt-6 flex items-start gap-3 border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertCircle size={20} className="shrink-0" />
            <p>{session.perfil === "PACIENTE" ? "Você pode pular esta etapa, mas não poderá agendar consultas enquanto o endereço estiver incompleto." : "Seu perfil está incompleto. Complete o endereço do atendimento."} Foto e telefone adicional são opcionais.</p>
          </div>}
          <form onSubmit={save} className="mt-8 space-y-8">
            <fieldset disabled={saving || preparing} className="min-w-0 border-0 p-0">
              <legend className="text-lg font-semibold">Foto de perfil</legend>
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white dark:border-darkTheme-border dark:bg-darkTheme-surface">
                  {preview ? <img src={preview} alt="Foto de perfil" className="h-full w-full object-cover" /> : <UserRound size={40} className="text-slate-400" />}
                </div>
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-medium dark:border-darkTheme-border">
                    <Upload size={17} />Escolher foto
                    <input aria-label="Foto de perfil" type="file" accept="image/jpeg,image/png" onChange={selectPhoto} className="sr-only" />
                  </label>
                  <p className="mt-2 text-sm text-slate-500 dark:text-darkTheme-muted">JPEG ou PNG, até 8 MB.</p>
                  {preparing && <p role="status" className="mt-2 text-sm">Preparando foto...</p>}
                  {!removePhoto && (photoFile || photo) && <button type="button" onClick={() => { setPhotoFile(null); setRemovePhoto(true); setMessage(""); }} className="mt-2 inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-400"><Trash2 size={16} />Remover foto</button>}
                </div>
              </div>
            </fieldset>
            <fieldset disabled={saving} className="min-w-0 border-0 border-t border-slate-200 pt-6 dark:border-darkTheme-border">
              <legend className="text-lg font-semibold">Endereço</legend>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">CEP<input className={fieldClass} inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{8}" value={form.cep} onChange={event => update("cep", event.target.value.replace(/\D/g, "").slice(0, 8))} /></label>
                <label className="block text-sm font-medium">Rua<input className={fieldClass} autoComplete="address-line1" maxLength={160} value={form.logradouro} onChange={event => update("logradouro", event.target.value)} /></label>
                <label className="block text-sm font-medium">Número<input className={fieldClass} maxLength={20} value={form.numero} onChange={event => update("numero", event.target.value)} /></label>
                <label className="block text-sm font-medium">Bairro<input className={fieldClass} maxLength={100} value={form.bairro} onChange={event => update("bairro", event.target.value)} /></label>
                <label className="block text-sm font-medium">Cidade<input className={fieldClass} required autoComplete="address-level2" maxLength={100} value={form.cidade} onChange={event => update("cidade", event.target.value)} /></label>
                <label className="block text-sm font-medium"><span id="perfil-estado">Estado</span><select aria-labelledby="perfil-estado" className={fieldClass} required autoComplete="address-level1" value={form.uf} onChange={event => update("uf", event.target.value)}><option value="">Selecione</option>{states.map(state => <option key={state} value={state}>{state}</option>)}</select></label>
              </div>
            </fieldset>
            <fieldset disabled={saving} className="min-w-0 border-0 border-t border-slate-200 pt-6 dark:border-darkTheme-border">
              <legend className="text-lg font-semibold">Telefones</legend>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium leading-6">Telefone principal<input className={`${fieldClass} bg-slate-100 dark:bg-darkTheme-panel`} readOnly value={profile.telefone || ""} /></label>
                <PhoneFields countryLabel="País do telefone adicional" phoneLabel="Telefone adicional (opcional)" country={form.paisTelefoneAdicional} value={form.telefoneAdicional}
                  onCountryChange={value => update("paisTelefoneAdicional", value)} onChange={value => update("telefoneAdicional", value)} />
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6 dark:border-darkTheme-border">
              <button disabled={saving || preparing} className="inline-flex h-11 items-center justify-center gap-2 rounded bg-mint px-5 font-semibold text-ink disabled:opacity-60"><Save size={18} />{saving ? "Salvando..." : "Salvar perfil"}</button>
              <Link to="/dashboard" className="text-sm font-medium text-sky dark:text-mint">{profile.completo ? "Voltar ao painel" : "Pular por enquanto"}</Link>
            </div>
          </form>
          {session.perfil === "FISIO" && <ProfessionalSettings />}
        </>}
      </section>
    </main>
  );
}
