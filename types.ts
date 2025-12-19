
export type MediaType = 'image' | 'video' | 'audio' | 'poll';
export type MediaCategory = 'pizza' | 'champion' | 'team';

export interface PollData {
    question: string;
    options: { id: string; text: string }[];
    votes: Record<string, string[]>; // userId -> array of optionIds
    allowMultiple: boolean;
}

export interface MediaItem {
  id: string;
  url: string; // Base64 string (empty for polls)
  type: MediaType;
  category: MediaCategory;
  date: number;
  caption?: string; // Text overlay/phrase
  hiddenFromFeed?: boolean; // New property to hide from NewsFeed
  poll?: PollData; // Specific data for polls
}

export interface Reply {
    id: string;
    user: string;
    text: string;
    date: string;
    reactions: Record<string, string>; // userId -> emoji
}

export interface Comment {
    id: string;
    user: string;
    text: string;
    date: string;
    reactions: Record<string, string>; // userId -> emoji
    replies?: Reply[]; // Nested replies
}

export interface SocialData {
    likes: Record<string, Record<string, string>>; // mediaId -> { userId: emoji }
    comments: Record<string, Comment[]>; // mediaId -> comments
}

export interface PizzaData {
  id: number | string;
  // SALGADA (Default)
  beautyScores: Record<string, number>;
  tasteScores: Record<string, number>;
  bonusScores?: Record<string, number>; // Novo campo para Bônus Salgada (0 ou 1)
  
  // DOCE (New)
  beautyScoresDoce?: Record<string, number>;
  tasteScoresDoce?: Record<string, number>;
  bonusScoresDoce?: Record<string, number>; // Novo campo para Bônus Doce (0 ou 1)

  // Maps userId -> boolean (true if voted) - Shared or split? Assuming shared confirmation for simplicity, OR split logic in UI
  confirmedVotes?: Record<string, boolean>;
  
  // Maps userId -> note
  userNotes?: Record<string, string>;
  notes?: string; // Legacy/Global notes (optional)
  media?: MediaItem[]; // Replaces photos
  photos?: string[]; // Deprecated, kept for migration
  scheduledDate?: string; // ISO Date string (YYYY-MM-DD)
}

export interface AnalysisResponse {
  summary: string;
  winner: string;
  suggestion: string;
}

export interface UserAccount {
    nickname: string;
    phone: string; 
    password: string; // 4 digits
    isVerified: boolean;
    avatar?: string; // Base64 image
    cover?: string; // Base64 image for profile background
    xpOffset?: number; // Offset para reset de nível (XP a ser subtraído)
    pointsOffset?: number; // Offset para reset de pontos (Pontos a serem subtraídos)
}

export enum SortOption {
  ID = 'ID',
  TOTAL = 'TOTAL',
  BEAUTY = 'BEAUTY',
  TASTE = 'TASTE'
}

// Helper to get average
export const getAverage = (scores: Record<string, number> | undefined): number => {
  if (!scores) return 0;
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
};

// Helper to get sum
export const getSum = (scores: Record<string, number> | undefined): number => {
  if (!scores) return 0;
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0);
};

// Fix: Export getConfirmedSum to resolve module error in Charts.tsx
export const getConfirmedSum = (pizza: PizzaData, category: 'salgada' | 'doce'): number => {
    let beautyScores, tasteScores, bonusScores;
    if (category === 'salgada') {
        beautyScores = pizza.beautyScores;
        tasteScores = pizza.tasteScores;
        bonusScores = pizza.bonusScores || {};
    } else {
        beautyScores = pizza.beautyScoresDoce || {};
        tasteScores = pizza.tasteScoresDoce || {};
        bonusScores = pizza.bonusScoresDoce || {};
    }
    const confirmedVotes = pizza.confirmedVotes || {};
    let sum = 0;
    Object.keys(beautyScores).forEach(userId => {
        if (confirmedVotes[userId]) {
            sum += (beautyScores[userId] || 0);
            sum += (tasteScores[userId] || 0);
            sum += (bonusScores[userId] || 0);
        }
    });
    return sum;
};
