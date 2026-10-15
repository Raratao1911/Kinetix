import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function ExerciseTimer({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) setRunning(false);
    }, 200);
    return () => clearInterval(timer);
  }, [running]);
  function toggle() {
    if (!running) { const next = remaining || seconds; setRemaining(next); deadline.current = Date.now() + next * 1000; }
    setRunning(value => !value);
  }
  return <div className="my-3 flex items-center gap-3">
    <output aria-label="Tempo restante" className="w-20 text-center text-lg font-semibold tabular-nums">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</output>
    <button type="button" className="kx-icon" title={running ? "Pausar cronômetro" : "Iniciar cronômetro"} aria-label={running ? "Pausar cronômetro" : "Iniciar cronômetro"} onClick={toggle}>{running ? <Pause size={17} /> : <Play size={17} />}</button>
    <button type="button" className="kx-icon" title="Reiniciar cronômetro" aria-label="Reiniciar cronômetro" onClick={() => { setRunning(false); setRemaining(seconds); }}><RotateCcw size={17} /></button>
    {remaining === 0 && <span role="status" className="kx-muted">Tempo concluído.</span>}
  </div>;
}
