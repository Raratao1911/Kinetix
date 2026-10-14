import React from 'react';
import { LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../state/AuthContext.jsx";


export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.mensagem ?? err.response?.data?.message ?? "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Acesse sua área de reabilitação"
      subtitle="Bem-vindo ao KINETIX."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-ink dark:text-darkTheme-text">Entrar</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-darkTheme-muted">Use seu email cadastrado no KINETIX.</p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
          <input
            className="mt-1 h-11 w-full rounded border border-slate-300 bg-white px-3 outline-none focus:border-sky dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-darkTheme-text"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</span>
          <input
            className="mt-1 h-11 w-full rounded border border-slate-300 bg-white px-3 outline-none focus:border-sky dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-darkTheme-text"
            type="password"
            value={form.senha}
            onChange={(event) => setForm({ ...form, senha: event.target.value })}
            required
          />
        </label>

        {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-mint px-4 font-semibold text-ink disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          <LogIn size={18} />
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-darkTheme-muted">
          Ainda não tem conta?{" "}
          <Link className="font-semibold text-sky" to="/cadastro">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

