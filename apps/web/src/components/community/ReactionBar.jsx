import React from 'react';
import { toggleReaction, getReactions } from '../../lib/communityLocal';

const REACTIONS = ['🐕', '❤️', '👍', '🙌'];

export function ReactionBar({ postId, onReact }) {
  const reactions = getReactions();
  const postReactions = reactions[postId] || {};

  const handleReact = (emoji) => {
    toggleReaction(postId, emoji);
    if (onReact) onReact();
  };

  return (
    <div className="flex items-center gap-2">
      {REACTIONS.map((emoji) => {
        const count = postReactions[emoji] || 0;
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 transition-colors text-sm"
            aria-label={`React with ${emoji}`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs text-slate-600">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
