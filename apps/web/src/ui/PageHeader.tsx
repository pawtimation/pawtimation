import React from "react";
import BackButton from "./BackButton";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;        // optional route; if omitted uses history -1
  onBack?: () => void;    // optional callback; takes priority over backTo
  action?: React.ReactNode;
  heroUrl?: string;       // optional background image
};

export default function PageHeader({ title, subtitle, backTo, onBack, action, heroUrl }: Props) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200">
      {heroUrl && (
        <>
          <img src={heroUrl} alt="" aria-hidden
               className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/65 to-teal-600/45" />
        </>
      )}
      <div className={`relative ${heroUrl ? "p-5 sm:p-6 text-white" : "p-5 sm:p-6 bg-white"}`}>
        <div className="flex items-start justify-between gap-3">
          <BackButton to={backTo} onBack={onBack} className={heroUrl ? "bg-white/90 text-slate-900" : ""} />
          {action}
        </div>
        <h1 className={`mt-3 text-2xl font-semibold tracking-tight ${heroUrl ? "text-white" : "text-slate-900"}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-1 text-base ${heroUrl ? "text-white/90" : "text-slate-600"}`}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
