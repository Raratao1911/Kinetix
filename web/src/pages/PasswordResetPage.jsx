import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import { api } from "../api/client.js";

export default function PasswordResetPage() {
  const location = useLocation();
  const redefinindo = location.pathname === "/redefinir-senha";
  const [token] = useState(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    if (value) window.history.replaceState(null, "", window.location.pathname);
    return value;
  });
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setErro(""); setStatus("");
    if (redefinindo && senha !== confirmacao) { setErro("As senhas devem ser iguais."); return; }
    if (redefinindo && new TextEncoder().encode(senha).length > 72) { setErro("A senha deve ter no máximo 72 bytes UTF-8."); return; }
    setLoading(true);
    try {
      const { data } = await api.post(`/api/v1/auth/${redefinindo ? "redefinir-senha" : "esqueci-senha"}`,
        redefinindo ? { token, senha } : { email }, { headers: { Authorization: null } });
      setStatus(data.mensagem);
      setSenha(""); setConfirmacao("");
    } catch (e) { setErro(e.response?.data?.mensagem || e.response?.data?.message || "Não foi possível concluir. Tente novamente."); }
    finally { setLoading(false); }
  }
  const input = "mt-1 h-11 w-full rounded border border-slate-300 bg-white px-3 dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-darkTheme-text";
  return <AuthShell title="Recupere seu acesso" subtitle="Volte a cuidar da sua recuperação.">
    <h2 className="text-2xl font-semibold">{redefinindo ? "Redefinir senha" : "Esqueci minha senha"}</h2>
    <p className="my-3 text-sm text-slate-600 dark:text-darkTheme-muted">{redefinindo ? "Escolha uma nova senha com pelo menos 8 caracteres." : "Informe seu e-mail para receber um link válido por 30 minutos."}</p>
    {redefinindo && !token ? <p role="alert">Link inválido. <Link className="text-sky underline" to="/esqueci-senha">Solicite um novo link</Link>.</p> :
      <form onSubmit={submit} className="space-y-4">
        {!redefinindo ? <label className="block">E-mail<input className={input} type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} /></label> : <>
          <label className="block">Nova senha<input className={input} type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={senha} onChange={e => setSenha(e.target.value)} /></label>
          <label className="block">Confirmar nova senha<input className={input} type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirmacao} onChange={e => setConfirmacao(e.target.value)} /></label>
        </>}
        {erro && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        {status && <p role="status" className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{status}</p>}
        <button type="submit" disabled={loading || (redefinindo && !!status)} className="min-h-11 w-full rounded bg-mint px-4 py-3 font-semibold text-ink disabled:opacity-60">{loading ? "Aguarde..." : redefinindo ? "Salvar nova senha" : "Enviar link de redefinição"}</button>
      </form>}
    <Link to="/login" className="mt-5 inline-block font-semibold text-sky underline">Voltar para entrar</Link>
  </AuthShell>;
}
