import React from 'react';
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../state/AuthContext.jsx";

const initialForm = {
  nome: "",
  email: "",
  senha: "",
  perfil: "PACIENTE",
  telefone: "",
  dataNascimento: "",
  cidade: "",
  bairro: "",
  uf: "",
  crefitoNumero: "",
  crefitoUf: "",
  nomeClinica: "",
  apresentacao: "",
  logradouro: "",
  numero: "",
  cep: "",
  atendeOnline: false,
  aceiteTermos: false
};

const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-300";
const fieldClass = "mt-1 h-11 w-full rounded border border-slate-300 bg-white px-3 outline-none focus:border-sky dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-darkTheme-text";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerPaciente, registerFisioterapeuta } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (form.perfil === "PACIENTE") {
        await registerPaciente({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          telefone: form.telefone || null,
          dataNascimento: form.dataNascimento || null,
          cidade: form.cidade || null,
          bairro: form.bairro || null,
          uf: form.uf || null
        });
      } else {
        await registerFisioterapeuta({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          telefone: form.telefone || null,
          crefitoNumero: form.crefitoNumero,
          crefitoUf: form.crefitoUf,
          nomeClinica: form.nomeClinica || null,
          apresentacao: form.apresentacao || null,
          cidade: form.cidade,
          uf: form.uf,
          logradouro: form.logradouro || null,
          numero: form.numero || null,
          bairro: form.bairro || null,
          cep: form.cep || null,
          atendeOnline: form.atendeOnline,
          especialidadesIds: []
        });
      }
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.mensagem ?? err.response?.data?.message ?? "Não foi possível cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crie uma conta KINETIX"
      subtitle="O cadastro define o perfil de acesso e registra o consentimento para tratamento dos dados."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink dark:text-darkTheme-text">Cadastro</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-darkTheme-muted">Preencha os dados essenciais para iniciar.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Nome</span>
            <input className={fieldClass} value={form.nome} onChange={(event) => update("nome", event.target.value)} required />
          </label>

          <label className="block">
            <span className={labelClass}>Email</span>
            <input className={fieldClass} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
          </label>

          <label className="block">
            <span className={labelClass}>Senha</span>
            <input className={fieldClass} type="password" value={form.senha} onChange={(event) => update("senha", event.target.value)} required minLength={8} />
          </label>

          <label className="block">
            <span className={labelClass}>Perfil</span>
            <select className={fieldClass} value={form.perfil} onChange={(event) => update("perfil", event.target.value)}>
              <option value="PACIENTE">Paciente</option>
              <option value="FISIO">Fisioterapeuta</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Telefone</span>
            <input className={fieldClass} value={form.telefone} onChange={(event) => update("telefone", event.target.value)} />
          </label>

          {form.perfil === "PACIENTE" && (
            <>
              <label className="block">
                <span className={labelClass}>Data de nascimento</span>
                <input className={fieldClass} type="date" value={form.dataNascimento} onChange={(event) => update("dataNascimento", event.target.value)} />
              </label>
            </>
          )}

          {form.perfil === "FISIO" && (
            <>
              <label className="block">
                <span className={labelClass}>CREFITO</span>
                <input className={fieldClass} value={form.crefitoNumero} onChange={(event) => update("crefitoNumero", event.target.value)} required />
              </label>
              <label className="block">
                <span className={labelClass}>UF do CREFITO</span>
                <input className={fieldClass} maxLength={2} value={form.crefitoUf} onChange={(event) => update("crefitoUf", event.target.value.toUpperCase())} required />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Nome da clínica</span>
                <input className={fieldClass} value={form.nomeClinica} onChange={(event) => update("nomeClinica", event.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Apresentação</span>
                <input className={fieldClass} value={form.apresentacao} onChange={(event) => update("apresentacao", event.target.value)} />
              </label>
              <label className="block">
                <span className={labelClass}>Logradouro</span>
                <input className={fieldClass} value={form.logradouro} onChange={(event) => update("logradouro", event.target.value)} />
              </label>
              <label className="block">
                <span className={labelClass}>Número</span>
                <input className={fieldClass} value={form.numero} onChange={(event) => update("numero", event.target.value)} />
              </label>
            </>
          )}

          <label className="block">
            <span className={labelClass}>Cidade</span>
            <input className={fieldClass} value={form.cidade} onChange={(event) => update("cidade", event.target.value)} required={form.perfil === "FISIO"} />
          </label>

          <label className="block">
            <span className={labelClass}>UF</span>
            <input className={fieldClass} maxLength={2} value={form.uf} onChange={(event) => update("uf", event.target.value.toUpperCase())} required={form.perfil === "FISIO"} />
          </label>

          <label className="block">
            <span className={labelClass}>Bairro</span>
            <input className={fieldClass} value={form.bairro} onChange={(event) => update("bairro", event.target.value)} />
          </label>

          {form.perfil === "FISIO" && (
            <>
              <label className="block">
                <span className={labelClass}>CEP</span>
                <input className={fieldClass} value={form.cep} onChange={(event) => update("cep", event.target.value)} />
              </label>
              <label className="flex items-center gap-3 pt-7 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.atendeOnline} onChange={(event) => update("atendeOnline", event.target.checked)} />
                Atende online
              </label>
            </>
          )}
        </div>

        <label className="flex items-start gap-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-slate-300">
          <input className="mt-1" type="checkbox" checked={form.aceiteTermos} onChange={(event) => update("aceiteTermos", event.target.checked)} required />
          <span>Aceito os termos de uso e a política de privacidade.</span>
        </label>

        {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-mint px-4 font-semibold text-ink disabled:opacity-60" type="submit" disabled={loading}>
          <UserPlus size={18} />
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-darkTheme-muted">
          Já tem conta?{" "}
          <Link className="font-semibold text-sky" to="/login">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

