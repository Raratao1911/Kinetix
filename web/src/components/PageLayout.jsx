import React, { useLayoutEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CalendarDays, Search, LayoutDashboard, Settings, LogIn, LogOut } from "lucide-react";
import Brand from "./Brand.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export const money = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dateTime = value => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
export const errorMessage = error => error.response?.data?.mensagem || "Não foi possível concluir a operação. Tente novamente.";
export const statusLabel = value => ({ SOLICITADA: "Solicitada", CONFIRMADA: "Confirmada", REALIZADA: "Realizada", FALTOU: "Não compareceu", CANCELADA_PACIENTE: "Cancelada pelo paciente", CANCELADA_FISIO: "Cancelada pelo profissional", CANCELADA_ADMIN: "Cancelada pela administração" }[value] || value);

export default function PageLayout({ title, children, actions }) {
  const { session, logout } = useAuth();
  const location = useLocation();
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location.pathname]);
  return <main className="kx-page">
    <header className="border-b border-slate-200 bg-sky text-white dark:border-darkTheme-border dark:bg-darkTheme-panel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-2">
        <Brand />
        <nav aria-label="Navegação principal" className="mr-12 flex flex-wrap items-center gap-4 text-sm">
          <NavLink to="/profissionais" className="kx-nav"><Search size={17} />Buscar</NavLink>
          {session ? <>
            <NavLink to="/dashboard" className="kx-nav"><LayoutDashboard size={17} />Painel</NavLink>
            <NavLink to="/agenda" className="kx-nav"><CalendarDays size={17} />Consultas</NavLink>
            <NavLink to="/configuracao-perfil" className="kx-nav"><Settings size={17} />Perfil</NavLink>
            <button onClick={logout} className="kx-nav"><LogOut size={17} />Sair</button>
          </> : <Link to="/login" className="kx-nav"><LogIn size={17} />Entrar</Link>}
        </nav>
      </div>
    </header>
    <div className="kx-content">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 break-words text-2xl font-semibold">{title}</h1>{actions}
      </div>
      {children}
    </div>
  </main>;
}

