import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import "./styles.css";
import { AuthProvider, useAuth } from "./state/AuthContext.jsx";
import PasswordResetPage from "./pages/PasswordResetPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PrescritorPage from "./pages/PrescritorPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import ProfessionalPage from "./pages/ProfessionalPage.jsx";
import AgendaPage from "./pages/AgendaPage.jsx";
import PatientPage from "./pages/PatientPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import PlansPage from "./pages/PlansPage.jsx";
import FinancePage from "./pages/FinancePage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";

function PrivateRoute({ children, perfil }) {
  const { session } = useAuth();
  if (session && perfil && session.perfil !== perfil) return <Navigate to="/dashboard" replace />;
  return session ? children : <Navigate to="/login" replace />;
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem("kinetix-theme");

  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ThemeToggle() {
  const [theme, setTheme] = React.useState(getInitialTheme);
  const isDark = theme === "dark";

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("kinetix-theme", theme);
  }, [isDark, theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="absolute right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white dark:border-darkTheme-border dark:bg-darkTheme-panel/85 dark:text-darkTheme-text dark:hover:bg-darkTheme-panel"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeToggle />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/esqueci-senha" element={<PasswordResetPage key="solicitar" />} />
          <Route path="/redefinir-senha" element={<PasswordResetPage key="redefinir" />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/profissionais" element={<SearchPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/privacidade" element={<PrivacyPage />} />
          <Route path="/termos" element={<PrivacyPage />} />
          <Route path="/administracao" element={<PrivateRoute perfil="ADMIN"><AdminPage /></PrivateRoute>} />
          <Route path="/financeiro" element={<PrivateRoute perfil="FISIO"><FinancePage /></PrivateRoute>} />
          <Route path="/profissionais/:id" element={<ProfessionalPage />} />
          <Route path="/agenda" element={<PrivateRoute><AgendaPage /></PrivateRoute>} />
          <Route path="/pacientes/:id" element={<PrivateRoute perfil="FISIO"><PatientPage /></PrivateRoute>} />
          <Route path="/configuracao-perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AccountDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/prescritor"
            element={
              <PrivateRoute perfil="FISIO">
                <PrescritorPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AccountDashboard() {
  const { session } = useAuth();
  return session?.perfil === "ADMIN" ? <Navigate to="/administracao" replace /> : <DashboardPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

