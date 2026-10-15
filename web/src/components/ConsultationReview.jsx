import React, { useState } from "react";
import { Star, Send } from "lucide-react";
import { api } from "../api/client.js";
import { errorMessage } from "./PageLayout.jsx";

export default function ConsultationReview({ consultaId }) {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function show() {
    if (open) { setOpen(false); return; }
    setBusy(true); setError("");
    try { setReview((await api.get(`/api/v1/consultas/${consultaId}/avaliacao`)).data || null); setOpen(true); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function send(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await api.post(`/api/v1/consultas/${consultaId}/avaliacao`, { nota: Number(rating), comentario: comment.trim() || null });
      setReview({ nota: Number(rating), comentario: comment, status: "PENDENTE" });
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <div className="min-w-0 w-full">
    <button className="kx-secondary" disabled={busy} onClick={show} aria-expanded={open}><Star size={17} />{open ? "Fechar avaliação" : "Avaliar atendimento"}</button>
    {open && (review ? <div className="mt-3"><p role="status">Sua avaliação: {review.nota}/5 · {({ PENDENTE: "Aguardando moderação", APROVADA: "Publicada", REJEITADA: "Não publicada" })[review.status]}</p><p className="whitespace-pre-wrap break-words kx-muted">{review.comentario}</p></div> : <form className="mt-3 max-w-lg space-y-3" onSubmit={send}>
      <label className="block text-sm"><span id={`avaliacao-nota-${consultaId}`}>Nota</span><select aria-labelledby={`avaliacao-nota-${consultaId}`} className="kx-input" value={rating} onChange={e => setRating(e.target.value)}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} {n === 1 ? "estrela" : "estrelas"}</option>)}</select></label>
      <label className="block text-sm">Comentário (opcional)<textarea className="kx-input" maxLength={1000} rows={3} value={comment} onChange={e => setComment(e.target.value)} /></label>
      <button className="kx-primary" disabled={busy}><Send size={17} />Enviar avaliação</button>
    </form>)}
    {error && <p className="kx-error" role="alert">{error}</p>}
  </div>;
}
