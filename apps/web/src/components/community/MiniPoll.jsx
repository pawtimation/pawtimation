import React, { useState, useEffect } from 'react';
import { getPollVote, setPollVote } from '../../lib/communityLocal';

export function MiniPoll({ postId, question, options, onVote }) {
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const vote = getPollVote(postId);
    if (vote) {
      setSelectedOption(vote);
    }
  }, [postId]);

  const handleVote = (option) => {
    setPollVote(postId, option);
    setSelectedOption(option);
    if (onVote) onVote();
  };

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-sm font-medium text-slate-700 mb-2">{question}</p>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleVote(option)}
            disabled={!!selectedOption}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              selectedOption === option
                ? 'bg-brand-teal text-white'
                : selectedOption
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-white border border-slate-300 hover:border-brand-teal hover:bg-emerald-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selectedOption && (
        <p className="text-xs text-slate-500 mt-2">Your vote: {selectedOption}</p>
      )}
    </div>
  );
}
