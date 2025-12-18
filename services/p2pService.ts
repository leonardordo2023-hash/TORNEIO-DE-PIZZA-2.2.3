
// @ts-ignore - Ignore type check for module resolution if needed
import { joinRoom } from 'trystero/mqtt';
import { PizzaData, MediaItem, SocialData, Comment, Reply, UserAccount } from '../types';
import { securityService } from './securityService';

const ROOM_ID = 'pizzagrade-realtime-universe-v11';

let room: any = null;
let heartbeatInterval: any = null; 

let sendVoteAction: any;
let sendConfirmVoteAction: any;
let sendGlobalNoteAction: any;
let sendFullSyncAction: any;
let requestSyncAction: any;
let sendResetAction: any;
let sendDeleteAction: any;
let sendMediaAction: any;
let sendMediaUpdateAction: any;
let sendMediaDeleteAction: any;
let sendDateAction: any;
let sendAddPizzaAction: any;
let sendCommentAction: any;
let sendCommentEditAction: any;
let sendCommentDeleteAction: any;
let sendReactionAction: any;
let sendCommentReactionAction: any;
let sendReplyAction: any;
let sendReplyReactionAction: any;
let sendPollVoteAction: any;
let sendAppNotificationAction: any;
let sendResetUserXPAction: any;
let sendUserUpdateAction: any;
let sendPresenceAction: any;

export interface VotePayload {
  pizzaId: number | string;
  userId: string;
  field: 'beautyScores' | 'tasteScores' | 'beautyScoresDoce' | 'tasteScoresDoce' | 'bonusScores' | 'bonusScoresDoce';
  value: number;
}

export interface ConfirmVotePayload {
    pizzaId: number | string;
    userId: string;
    status: boolean;
}

export interface GlobalNotePayload {
  pizzaId: number | string;
  note: string;
}

export interface DeletePayload {
  pizzaId: number | string;
}

export interface AddPizzaPayload {
    pizza: PizzaData;
}

export interface MediaPayload {
  pizzaId: number | string;
  mediaItem: MediaItem;
}

export interface MediaUpdatePayload {
    pizzaId: number | string;
    mediaId: string;
    caption: string;
}

export interface MediaDeletePayload {
  pizzaId: number | string;
  mediaId: string;
}

export interface DatePayload {
  pizzaId: number | string;
  date: string;
}

export interface CommentPayload {
    mediaId: string;
    comment: Comment;
}

export interface CommentEditPayload {
    mediaId: string;
    commentId: string;
    newText: string;
}

export interface CommentDeletePayload {
    mediaId: string;
    commentId: string;
}

export interface ReactionPayload {
    mediaId: string;
    userId: string;
    emoji: string;
}

export interface CommentReactionPayload {
    mediaId: string;
    commentId: string;
    userId: string;
    emoji: string;
}

export interface ReplyPayload {
    mediaId: string;
    commentId: string;
    reply: Reply;
}

export interface ReplyReactionPayload {
    mediaId: string;
    commentId: string;
    replyId: string;
    userId: string;
    emoji: string;
}

export interface PollVotePayload {
    pizzaId: number | string;
    mediaId: string;
    userId: string;
    selectedOptions: string[];
}

export interface AppNotificationPayload {
    title: string;
    message: string;
    targetTab: string;
}

export interface FullSyncPayload {
    pizzas: PizzaData[];
    socialData: SocialData;
    users?: UserAccount[]; 
}

export interface ResetXPPayload {
    targetNickname: string;
    resetTime: number;
}

export interface PresencePayload {
    nickname: string;
}

export interface SyncCallbacks {
  onVoteUpdate: (payload: VotePayload) => void;
  onVoteConfirm: (payload: ConfirmVotePayload) => void;
  onGlobalNoteUpdate: (payload: GlobalNotePayload) => void;
  onFullSync: (payload: FullSyncPayload) => void;
  onPeerCountChange: (count: number) => void;
  onReset: () => void;
  onDelete: (pizzaId: number | string) => void;
  onAddPizza: (payload: AddPizzaPayload) => void;
  onMediaAdd: (payload: MediaPayload) => void;
  onMediaUpdate: (payload: MediaUpdatePayload) => void; 
  onMediaDelete: (payload: MediaDeletePayload) => void;
  onDateUpdate: (payload: DatePayload) => void;
  onCommentAdd: (payload: CommentPayload) => void;
  onCommentEdit: (payload: CommentEditPayload) => void;
  onCommentDelete: (payload: CommentDeletePayload) => void;
  onReactionUpdate: (payload: ReactionPayload) => void;
  onCommentReactionUpdate: (payload: CommentReactionPayload) => void;
  onReplyAdd: (payload: ReplyPayload) => void;
  onReplyReactionUpdate: (payload: ReplyReactionPayload) => void;
  onPollVoteUpdate: (payload: PollVotePayload) => void;
  onAppNotification: (payload: AppNotificationPayload) => void;
  onResetUserXP?: (payload: ResetXPPayload) => void;
  onUserUpdate?: (payload: UserAccount) => void;
  onPresence?: (payload: PresencePayload, peerId: string) => void;
  getCurrentState: () => { pizzas: PizzaData[], socialData: SocialData, users: UserAccount[] };
}

export const initializeP2P = ({ 
    onVoteUpdate, onVoteConfirm, onGlobalNoteUpdate, onFullSync, onPeerCountChange, onReset, onDelete, onAddPizza,
    onMediaAdd, onMediaUpdate, onMediaDelete, onDateUpdate, 
    onCommentAdd, onCommentEdit, onCommentDelete, onReactionUpdate, onCommentReactionUpdate,
    onReplyAdd, onReplyReactionUpdate, onPollVoteUpdate, onAppNotification, onResetUserXP, onUserUpdate, onPresence,
    getCurrentState 
}: SyncCallbacks) => {
  const config = { appId: 'pizzagrade-app-live-v10' };
  
  if (room) try { if(room.leave) room.leave(); room = null; } catch (e) {}

  try { room = joinRoom(config, ROOM_ID); } catch (error) { return null; }

  const [sendVote, getVote] = room.makeAction('vote');
  const [sendConfirm, getConfirm] = room.makeAction('voteConfirm');
  const [sendNote, getNote] = room.makeAction('note');
  const [sendSync, getSync] = room.makeAction('fullSyncV2'); 
  const [requestSync, getRequest] = room.makeAction('reqSync');
  const [sendReset, getReset] = room.makeAction('reset');
  const [sendDelete, getDelete] = room.makeAction('deletePizza');
  const [sendAddPizza, getAddPizza] = room.makeAction('addPizza');
  const [sendMedia, getMedia] = room.makeAction('addMedia');
  const [sendMediaUpdate, getMediaUpdate] = room.makeAction('updMedia');
  const [sendMediaDelete, getMediaDelete] = room.makeAction('deleteMedia');
  const [sendDate, getDate] = room.makeAction('dateUpdate');
  const [sendComment, getComment] = room.makeAction('addComment');
  const [sendCommentEdit, getCommentEdit] = room.makeAction('editComment');
  const [sendCommentDelete, getCommentDelete] = room.makeAction('delComment');
  const [sendReaction, getReaction] = room.makeAction('react');
  const [sendCommentReaction, getCommentReaction] = room.makeAction('reactComment');
  const [sendReply, getReply] = room.makeAction('addReply');
  const [sendReplyReaction, getReplyReaction] = room.makeAction('reactReply');
  const [sendPollVote, getPollVote] = room.makeAction('votePoll');
  const [sendAppNotification, getAppNotification] = room.makeAction('appNotif');
  const [sendResetXP, getResetXP] = room.makeAction('resetXP');
  const [sendUserUpdate, getUserUpdate] = room.makeAction('userUpd');
  const [sendPresence, getPresence] = room.makeAction('presence');
  const [sendHeartbeat, getHeartbeat] = room.makeAction('hb');

  sendVoteAction = sendVote;
  sendConfirmVoteAction = sendConfirm;
  sendGlobalNoteAction = sendNote;
  sendFullSyncAction = sendSync;
  requestSyncAction = requestSync;
  sendResetAction = sendReset;
  sendDeleteAction = sendDelete;
  sendAddPizzaAction = sendAddPizza;
  sendMediaAction = sendMedia;
  sendMediaUpdateAction = sendMediaUpdate;
  sendMediaDeleteAction = sendMediaDelete;
  sendDateAction = sendDate;
  sendCommentAction = sendComment;
  sendCommentEditAction = sendCommentEdit;
  sendCommentDeleteAction = sendCommentDelete;
  sendReactionAction = sendReaction;
  sendCommentReactionAction = sendCommentReaction;
  sendReplyAction = sendReply;
  sendReplyReactionAction = sendReplyReaction;
  sendPollVoteAction = sendPollVote;
  sendAppNotificationAction = sendAppNotification;
  sendResetUserXPAction = sendResetXP;
  sendUserUpdateAction = sendUserUpdate;
  sendPresenceAction = sendPresence;

  getVote(onVoteUpdate);
  getConfirm(onVoteConfirm);
  getNote((p: any) => { p.note = securityService.sanitizeInput(p.note); onGlobalNoteUpdate(p); });
  getSync(onFullSync);
  getRequest(() => {
    const currentState = securityService.deepClean(getCurrentState());
    if (currentState.pizzas.length > 0) setTimeout(() => { if (sendSync) sendSync(currentState); }, Math.random() * 500);
  });
  getReset(onReset);
  getDelete((p: any) => onDelete(p.pizzaId));
  getAddPizza(onAddPizza);
  getMedia(onMediaAdd);
  getMediaUpdate((p: any) => { p.caption = securityService.sanitizeInput(p.caption); onMediaUpdate(p); });
  getMediaDelete(onMediaDelete);
  getDate(onDateUpdate);
  getComment((p: any) => { p.comment.text = securityService.sanitizeInput(p.comment.text); onCommentAdd(p); });
  getCommentEdit((p: any) => { p.newText = securityService.sanitizeInput(p.newText); onCommentEdit(p); });
  getCommentDelete(onCommentDelete);
  getReaction(onReactionUpdate);
  getCommentReaction(onCommentReactionUpdate);
  getReply((p: any) => { p.reply.text = securityService.sanitizeInput(p.reply.text); onReplyAdd(p); });
  getReplyReaction(onReplyReactionUpdate);
  getPollVote(onPollVoteUpdate);
  getAppNotification(onAppNotification);
  if (onResetUserXP) getResetXP(onResetUserXP);
  if (onUserUpdate) getUserUpdate(onUserUpdate);
  if (onPresence) getPresence(onPresence);
  getHeartbeat(() => {});

  const updatePeerCount = () => {
    try {
        if (!room) return;
        const peers = room.getPeers();
        const count = peers ? Object.keys(peers).length : 0;
        onPeerCountChange(count + 1);
    } catch (e) {}
  };

  room.onPeerJoin(() => {
    updatePeerCount();
    const currentState = securityService.deepClean(getCurrentState());
    if(currentState.pizzas.length > 0) { if(sendSync) sendSync(currentState); }
  });

  room.onPeerLeave(updatePeerCount);

  heartbeatInterval = setInterval(() => {
      try { if (sendHeartbeat) sendHeartbeat(Date.now()); } catch (e) {}
  }, 5000);

  setTimeout(() => { updatePeerCount(); if (requestSync) requestSync(null); }, 300);

  return room;
};

// Internal helper to ensure all broadcasts are clean of circular refs/DOM nodes
const cleanSend = (action: any, payload: any) => {
    if (action) {
        const clean = securityService.deepClean(payload);
        action(clean);
    }
};

export const forceManualSync = () => { if (requestSyncAction) requestSyncAction(null); };
export const broadcastVote = (p: VotePayload) => cleanSend(sendVoteAction, p);
export const broadcastConfirmVote = (p: ConfirmVotePayload) => cleanSend(sendConfirmVoteAction, p);
export const broadcastGlobalNote = (p: GlobalNotePayload) => cleanSend(sendGlobalNoteAction, p);
export const broadcastReset = () => { if (sendResetAction) sendResetAction(null); };
export const broadcastDelete = (pizzaId: number | string) => cleanSend(sendDeleteAction, { pizzaId });
export const broadcastAddPizza = (p: AddPizzaPayload) => cleanSend(sendAddPizzaAction, p);
export const broadcastMedia = (p: MediaPayload) => cleanSend(sendMediaAction, p);
export const broadcastMediaUpdate = (p: MediaUpdatePayload) => cleanSend(sendMediaUpdateAction, p);
export const broadcastDeleteMedia = (p: MediaDeletePayload) => cleanSend(sendMediaDeleteAction, p);
export const broadcastDate = (p: DatePayload) => cleanSend(sendDateAction, p);
export const broadcastComment = (p: CommentPayload) => cleanSend(sendCommentAction, p);
export const broadcastCommentEdit = (p: CommentEditPayload) => cleanSend(sendCommentEditAction, p);
export const broadcastCommentDelete = (p: CommentDeletePayload) => cleanSend(sendCommentDeleteAction, p);
export const broadcastReaction = (p: ReactionPayload) => cleanSend(sendReactionAction, p);
export const broadcastCommentReaction = (p: CommentReactionPayload) => cleanSend(sendCommentReactionAction, p);
export const broadcastReply = (p: ReplyPayload) => cleanSend(sendReplyAction, p);
export const broadcastReplyReaction = (p: ReplyReactionPayload) => cleanSend(sendReplyReactionAction, p);
export const broadcastPollVote = (p: PollVotePayload) => cleanSend(sendPollVoteAction, p);
export const broadcastAppNotification = (p: AppNotificationPayload) => cleanSend(sendAppNotificationAction, p);
export const broadcastResetUserXP = (p: ResetXPPayload) => cleanSend(sendResetUserXPAction, p);
export const broadcastUserUpdate = (p: UserAccount) => cleanSend(sendUserUpdateAction, p);
export const broadcastPresence = (p: PresencePayload) => cleanSend(sendPresenceAction, p);
