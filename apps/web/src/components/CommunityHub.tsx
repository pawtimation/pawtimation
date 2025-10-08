import React, { useState } from 'react';
import { CommunityFeed } from './community/CommunityFeed';
import { TipsFeed } from './community/TipsFeed';

interface CommunityHubProps {
  PrivateChat: React.ComponentType<any>;
  onBack?: () => void;
}

export function CommunityHub({ PrivateChat, onBack }: CommunityHubProps) {
  const [tab, setTab] = useState<'community' | 'tips' | 'private'>('community');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with dog image */}
      <div className="relative bg-gradient-to-br from-blue-600 to-teal-600 rounded-b-2xl overflow-hidden shadow-lg mb-6">
        <div className="absolute inset-0 opacity-30">
          <img 
            src="/man-dog-walking.jpg" 
            alt="" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="relative p-6">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 px-3 py-2 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white font-medium transition text-sm"
            >
              ← Back
            </button>
          )}
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">Community Hub</h1>
          <p className="text-white/90 text-sm">Connect, share, and learn with fellow pet lovers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex gap-2" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'community'}
            onClick={() => setTab('community')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              tab === 'community'
                ? 'bg-brand-teal text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-teal'
            }`}
          >
            Community
          </button>
          <button
            role="tab"
            aria-selected={tab === 'tips'}
            onClick={() => setTab('tips')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              tab === 'tips'
                ? 'bg-brand-teal text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-teal'
            }`}
          >
            Tips
          </button>
          <button
            role="tab"
            aria-selected={tab === 'private'}
            onClick={() => setTab('private')}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              tab === 'private'
                ? 'bg-brand-teal text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-teal'
            }`}
          >
            Private
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {tab === 'community' && <CommunityFeed />}
        {tab === 'tips' && <TipsFeed />}
        {tab === 'private' && <PrivateChat onBack={() => setTab('community')} />}
      </div>
    </div>
  );
}
