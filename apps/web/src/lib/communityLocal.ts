const STORAGE_KEYS = {
  POSTS: 'pt_community_posts',
  REACTIONS: 'pt_community_reactions',
  POLLS: 'pt_community_polls'
};

export interface CommunityPost {
  id: string;
  user: string;
  type: 'text' | 'event' | 'tip';
  text: string;
  poll?: {
    options: string[];
  };
  timestamp?: number;
}

export interface Reaction {
  [postId: string]: {
    [emoji: string]: number;
  };
}

export interface PollVotes {
  [postId: string]: string;
}

function getDefaultSeed(): CommunityPost[] {
  return [
    { 
      id: 'seed-hello', 
      user: 'Pawtimation', 
      type: 'text',
      text: 'Welcome to the Community 🐾 Share your favourite walk spot or a tip!',
      timestamp: Date.now() - 7200000
    },
    { 
      id: 'seed-meetup', 
      user: 'Admin', 
      type: 'event',
      text: 'Thinking of a Winter Walk Meetup — interested?', 
      poll: { options: ['Yes', 'Maybe', 'Not this time'] },
      timestamp: Date.now() - 3600000
    },
    { 
      id: 'seed-tip', 
      user: 'Pawtimation', 
      type: 'tip',
      text: 'Cold weather tip: rinse paws after salty pavements and dry gently. 🧼🐾',
      timestamp: Date.now() - 1800000
    }
  ];
}

function getTipsSeed(): CommunityPost[] {
  return [
    { id: 'tip-1', user: 'Pawtimation', type: 'tip', text: 'Exercise tip: Match walk length to your dog's age and breed — puppies need short, frequent walks! 🐕', timestamp: Date.now() - 86400000 },
    { id: 'tip-2', user: 'Pawtimation', type: 'tip', text: 'Safety tip: Keep ID tags updated with your current phone number and address. 🏷️', timestamp: Date.now() - 172800000 },
    { id: 'tip-3', user: 'Pawtimation', type: 'tip', text: 'Weather tip: In hot weather, test pavement with your hand — if too hot for you, too hot for paws! 🌡️', timestamp: Date.now() - 259200000 },
    { id: 'tip-4', user: 'Pawtimation', type: 'tip', text: 'Training tip: Positive reinforcement works best — reward good behavior immediately! 🦴', timestamp: Date.now() - 345600000 },
    { id: 'tip-5', user: 'Pawtimation', type: 'tip', text: 'Health tip: Regular vet check-ups keep your pet happy and healthy. Book annually! 🏥', timestamp: Date.now() - 432000000 },
    { id: 'tip-6', user: 'Pawtimation', type: 'tip', text: 'Nutrition tip: Fresh water should always be available, especially after walks. 💧', timestamp: Date.now() - 518400000 },
    { id: 'tip-7', user: 'Pawtimation', type: 'tip', text: 'Socialization tip: Regular playtime with other dogs helps build confidence! 🐾', timestamp: Date.now() - 604800000 }
  ];
}

export function getPosts(): CommunityPost[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!stored) {
      const seed = getDefaultSeed();
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(stored);
  } catch {
    return getDefaultSeed();
  }
}

export function getTips(): CommunityPost[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POSTS + '_tips');
    if (!stored) {
      const seed = getTipsSeed();
      localStorage.setItem(STORAGE_KEYS.POSTS + '_tips', JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(stored);
  } catch {
    return getTipsSeed();
  }
}

export function addPost(post: CommunityPost): void {
  const posts = getPosts();
  posts.unshift({ ...post, timestamp: Date.now() });
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
}

export function getReactions(): Reaction {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.REACTIONS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function toggleReaction(postId: string, emoji: string): void {
  const reactions = getReactions();
  
  if (!reactions[postId]) {
    reactions[postId] = {};
  }
  
  if (!reactions[postId][emoji]) {
    reactions[postId][emoji] = 0;
  }
  
  reactions[postId][emoji] += 1;
  
  localStorage.setItem(STORAGE_KEYS.REACTIONS, JSON.stringify(reactions));
}

export function getPollVote(postId: string): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POLLS);
    const votes: PollVotes = stored ? JSON.parse(stored) : {};
    return votes[postId] || null;
  } catch {
    return null;
  }
}

export function setPollVote(postId: string, option: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.POLLS);
    const votes: PollVotes = stored ? JSON.parse(stored) : {};
    votes[postId] = option;
    localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(votes));
  } catch {
    console.error('Failed to save poll vote');
  }
}
