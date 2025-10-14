import React from "react";
import { Link, useNavigate } from "react-router-dom";

type Props = { to?: string; onBack?: () => void; label?: string; className?: string };
export default function BackButton({ to, onBack, label = "Back", className = "" }: Props) {
  const navigate = useNavigate();
  const base =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500";
  
  // Priority: onBack callback > to (Link) > history.back()
  if (onBack) {
    return (
      <button className={`${base} ${className}`} onClick={onBack} type="button" aria-label="Go back">
        <span aria-hidden>←</span>
        <span>{label}</span>
      </button>
    );
  }
  
  const El: any = to ? Link : "button";
  const props: any = to
    ? { to }
    : { onClick: () => navigate(-1), type: "button" };

  return (
    <El className={`${base} ${className}`} {...props} aria-label="Go back">
      <span aria-hidden>←</span>
      <span>{label}</span>
    </El>
  );
}
