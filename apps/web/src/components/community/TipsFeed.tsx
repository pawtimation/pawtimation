import React, { useState, useEffect } from 'react';
import { getTips, CommunityPost } from '../../lib/communityLocal';
import { ReactionBar } from './ReactionBar';

export function TipsFeed() {
  const [tips, setTips] = useState<CommunityPost[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setTips(getTips());
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <p className="text-sm text-emerald-900 font-medium">Pet Care Tips</p>
            <p className="text-xs text-emerald-700 mt-1">Expert advice for happy, healthy pets</p>
          </div>
        </div>
      </div>

      {tips.map((tip) => (
        <div
          key={tip.id}
          className="bg-white border border-slate-200 rounded-lg p-4 hover:border-emerald-200 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-slate-900">{tip.user}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Tip</span>
              </div>
              <p className="text-sm text-slate-700 break-words">{tip.text}</p>
            </div>
            <div className="flex-shrink-0">
              <ReactionBar postId={tip.id} onReact={handleRefresh} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
