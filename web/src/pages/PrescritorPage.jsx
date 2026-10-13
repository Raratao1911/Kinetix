import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Save, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import Brand from "../components/Brand.jsx";

const fieldClass = "w-full rounded border border-slate-300 bg-white p-2 outline-none focus:border-sky dark:border-darkTheme-border dark:bg-darkTheme-surface dark:text-darkTheme-text";

export default function PrescritorPage() {
  const [pacientes, setPacientes] = useState([]);
  const [exerciciosBase, setExerciciosBase] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [titulo, setTitulo] = useState("Plano de reabilitação");
  const [orientacoes, setOrientacoes] = useState("");
  const [plano, setPlano] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/fisioterapeuta/pacientes"),
      api.get("/api/v1/fisioterapeuta/exercicios")
    ])
      .then(([pacientesResponse, exerciciosResponse]) => {
        setPacientes(pacientesResponse.data);
        setExerciciosBase(exerciciosResponse.data);
      })
      .catch(() => setError("Não foi possível carregar pacientes e exercícios."));
  }, []);

  const addExercicio = () => {
    setPlano([...plano, { exercicioId: "", series: 3, repeticoes: 10, duracaoSegundos: "" }]);
  };

  const removeExercicio = (index) => {
    setPlano(plano.filter((_, i) => i !== index));
  };

  const updateExercicio = (index, field, value) => {
    const newPlano = [...plano];
    newPlano[index][field] = value;
    setPlano(newPlano);
  };

  async function handleSalvar() {
    setError("");
    if (!selectedPaciente || !titulo.trim() || plano.length === 0 || plano.some(item => !item.exercicioId || Number(item.series) < 1 || Number(item.repeticoes) < 1 || (item.duracaoSegundos && Number(item.duracaoSegundos) < 1))) {
      setError("Preencha o título, selecione um paciente e confira os exercícios e as quantidades.");
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/api/v1/fisioterapeuta/pacientes/${selectedPaciente}/prescricoes`, {
        titulo,
        orientacoes: orientacoes || null,
        inicio: new Date().toISOString().slice(0, 10),
        fim: null,
        consultaId: null,
        itens: plano.map((item, index) => ({
          exercicioId: Number(item.exercicioId),
          ordem: index + 1,
          series: Number(item.series),
          repeticoes: Number(item.repeticoes),
          duracaoSegundos: item.duracaoSegundos ? Number(item.duracaoSegundos) : null,
          frequencia: null,
          orientacoes: null
        }))
      });
      alert("Plano salvo com sucesso!");
      setPlano([]);
    } catch (err) {
      alert(err.response?.data?.mensagem ?? err.response?.data?.message ?? "Erro ao salvar plano.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink dark:bg-darkTheme-bg dark:text-darkTheme-text">
      <header className="border-b border-slate-200 bg-sky text-white dark:border-darkTheme-border dark:bg-darkTheme-panel">
        <div className="mx-auto flex min-h-36 max-w-6xl items-center px-5 py-2">
          <Brand inverse />
          <Link to="/dashboard" className="ml-auto text-sm font-medium">Minha conta</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink dark:text-darkTheme-text">Prescritor Digital</h1>
          <p className="text-slate-500 dark:text-darkTheme-muted">Monte o plano de reabilitação personalizado.</p>
        </div>
        <button 
          onClick={handleSalvar}
          disabled={loading}
          className="bg-mint text-ink px-6 py-2 rounded font-bold flex items-center gap-2"
        >
          <Save size={20} />
          {loading ? "Salvando..." : "Salvar Plano"}
        </button>
      </header>

      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 dark:border-darkTheme-border dark:bg-darkTheme-panel">
        {error && <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm font-medium mb-1">Título</span>
            <input className={fieldClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Orientações gerais</span>
            <input className={fieldClass} value={orientacoes} onChange={(e) => setOrientacoes(e.target.value)} />
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Paciente</label>
          <select 
            className={fieldClass}
            value={selectedPaciente}
            onChange={(e) => setSelectedPaciente(e.target.value)}
          >
            <option value="">Selecione um paciente...</option>
            {pacientes.map(p => <option key={p.usuarioId} value={p.usuarioId}>{p.nome}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {plano.map((item, index) => (
            <div key={index} className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded border border-slate-200 dark:border-darkTheme-border dark:bg-darkTheme-surface">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1 dark:text-darkTheme-muted">Exercício</label>
                <select 
                  className={fieldClass}
                  value={item.exercicioId}
                  onChange={(e) => updateExercicio(index, "exercicioId", e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {exerciciosBase.map(ex => <option key={ex.id} value={ex.id}>{ex.nome}</option>)}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1 dark:text-darkTheme-muted">Séries</label>
                <input type="number" className={fieldClass} value={item.series} onChange={(e) => updateExercicio(index, "series", e.target.value)} />
              </div>
              <div className="w-20">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1 dark:text-darkTheme-muted">Reps</label>
                <input type="number" className={fieldClass} value={item.repeticoes} onChange={(e) => updateExercicio(index, "repeticoes", e.target.value)} />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1 dark:text-darkTheme-muted">Tempo (s)</label>
                <input type="number" className={fieldClass} value={item.duracaoSegundos} onChange={(e) => updateExercicio(index, "duracaoSegundos", e.target.value)} />
              </div>
              <button title="Remover exercício" aria-label="Remover exercício" onClick={() => removeExercicio(index)} className="p-2 text-red-500 hover:bg-red-50 rounded dark:hover:bg-darkTheme-danger">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={addExercicio}
          className="mt-6 flex items-center gap-2 text-sky font-semibold hover:underline"
        >
          <Plus size={20} />
          Adicionar exercício
        </button>
      </section>
      </div>
    </div>
  );
}

