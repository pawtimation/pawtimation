import React from 'react';

interface HeaderBarProps {
  title: string;
  onBack?: () => void;
  right?: any;
}

export function HeaderBar({ title, onBack, right }: HeaderBarProps) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-screen-sm px-4 py-3 flex items-center justify-between">
        {onBack ? (
          <button 
            onClick={onBack} 
            className="text-[color:var(--brand)] font-medium flex items-center gap-1" 
            aria-label="Back"
          >
            ← Back
          </button>
        ) : (
          <div className="w-16" />
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
        {right ? right : <div className="w-16" />}
      </div>
    </div>
  );
}

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

export function HeroBanner({ title, subtitle, imageUrl }: HeroBannerProps) {
  return (
    <div className="mx-auto max-w-screen-sm px-4">
      <div className="rounded-[var(--r-xl)] overflow-hidden shadow-sm border border-emerald-100 relative mb-4">
        <div className="aspect-[16/8] bg-gradient-to-r from-emerald-600 to-teal-600">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="" 
              className="w-full h-full object-cover opacity-65 mix-blend-multiply" 
              loading="lazy"
            />
          )}
        </div>
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <h1 className="text-white text-2xl font-extrabold drop-shadow">{title}</h1>
          {subtitle && <p className="text-white/95 text-sm">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
