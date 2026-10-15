import React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api/client.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "kinetix.session";

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!session?.token || Date.parse(session.expiraEm) <= Date.now() || !Number.isFinite(Date.parse(session.expiraEm))) {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
      return null;
    }
    setAuthToken(session.token);
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  useEffect(() => {
    setAuthToken(session?.token);
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(logout, Math.max(0, Date.parse(session.expiraEm) - Date.now()));
    const interceptor = api.interceptors.response.use(response => response, error => {
      if (error.response?.status === 401) logout();
      return Promise.reject(error);
    });
    return () => {
      clearTimeout(timer);
      api.interceptors.response.eject(interceptor);
    };
  }, [session]);

  async function login(payload) {
    const { data } = await api.post("/api/v1/auth/login", payload);
    setAuthToken(data.token);
    setSession(data);
    return data;
  }

  async function registerPaciente(payload) {
    const { data } = await api.post("/api/v1/auth/pacientes", payload);
    setAuthToken(data.token);
    setSession(data);
    return data;
  }

  async function registerFisioterapeuta(payload) {
    const { data } = await api.post("/api/v1/auth/fisioterapeutas", payload);
    setAuthToken(data.token);
    setSession(data);
    return data;
  }

  function logout() {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  const value = useMemo(
    () => ({ session, login, registerPaciente, registerFisioterapeuta, logout }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
