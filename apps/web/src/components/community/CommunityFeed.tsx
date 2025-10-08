import React, { useState, useEffect } from 'react';
import { getPosts, addPost, CommunityPost } from '../../lib/communityLocal';
import { ReactionBar } from './ReactionBar';
import { MiniPoll } from './MiniPoll';
import { trackEvent } from '../../lib/metrics';

export function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPosts(getPosts());
  }, [refreshKey]);

  const handlePost = () => {
    if (!newPostText.trim()) return;
    
    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      user: 'You',
      type: 'text',
      text: newPostText.trim(),
      timestamp: Date.now()
    };
    
    addPost(newPost);
    setNewPostText('');
    setRefreshKey(k => k + 1);
    trackEvent('community_post');
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Pinned Welcome */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">📌</span>
          <div className="flex-1">
            <p className="text-sm text-emerald-900">
              Be kind, stay safe, no sharing private info.
            </p>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <textarea
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          rows={3}
          placeholder="Share a tip, meetup idea, or cute dog moment…"
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
        />
        <div className="mt-2 flex justify-between items-center">
          <p className="text-xs text-slate-500">💡 What to post: walk spots, tips, or meetup ideas</p>
          <button
            onClick={handlePost}
            disabled={!newPostText.trim()}
            className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Post
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600 mb-2">Say hello 👋 — first post gets a paw reaction!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900">{post.user}</span>
                    {post.type === 'event' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Event</span>}
                    {post.type === 'tip' && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Tip</span>}
                  </div>
                  <p className="text-sm text-slate-700 break-words">{post.text}</p>
                  {post.poll && (
                    <MiniPoll
                      postId={post.id}
                      question={post.text}
                      options={post.poll.options}
                      onVote={handleRefresh}
                    />
                  )}
                </div>
                <div className="flex-shrink-0">
                  <ReactionBar postId={post.id} onReact={handleRefresh} />
                </div>
              </div>
              {post.timestamp && (
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(post.timestamp).toLocaleString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
