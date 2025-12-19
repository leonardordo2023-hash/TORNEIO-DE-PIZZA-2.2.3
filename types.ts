
export type MediaType = 'image' | 'video' | 'audio' | 'poll' | 'file';
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
  fileName?: string; // Para arquivos genéricos
  hiddenFromFeed?: boolean; 
  poll?: PollData; 
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
  beautyScores: Record<string, number>;
  tasteScores: Record<string, number>;
  bonusScores?: Record<string, number>; 
  beautyScoresDoce?: Record<string, number>;
  tasteScoresDoce?: Record<string, number>;
  bonusScoresDoce?: Record<string, number>; 
  confirmedVotes?: Record<string, boolean>;
  userNotes?: Record<string, string>;
  notes?: string; 
  media?: MediaItem[]; 
  photos?: string[]; 
  scheduledDate?: string; 
}

export interface UserAccount {
    nickname: string;
    phone: string; 
    password: string; 
    isVerified: boolean;
    avatar?: string; 
    cover?: string; 
    xpOffset?: number; 
    pointsOffset?: number; 
    legacyLikes?: number; 
    legacyComments?: number; 
}

export const getSum = (scores: Record<string, number> | undefined): number => {
  if (!scores) return 0;
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0);
};

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
