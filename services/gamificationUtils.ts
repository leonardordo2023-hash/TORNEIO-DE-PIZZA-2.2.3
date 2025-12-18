
import { UserAccount, PizzaData, SocialData, getSum } from '../types';

export const calculateUserLevel = (
    currentUser: UserAccount | null, 
    pizzas: PizzaData[], 
    socialData: SocialData, 
    pizzaOwners: Record<number, string>
) => {
    if (!currentUser) return { level: 1, currentBarProgress: 0, totalPoints: 0, likesGiven: 0, commentsGiven: 0 };

    const cleanNick = currentUser.nickname.replace('@', '').trim();
    
    // 1. Identifica pizzas do usuário para pontos técnicos
    const myPizzaIds = Object.entries(pizzaOwners)
        .filter(([_, ownerName]) => String(ownerName).trim().toLowerCase() === cleanNick.toLowerCase())
        .map(([id, _]) => id);

    let liveRegularPoints = 0;
    let liveBonusPoints = 0;

    pizzas.forEach(p => {
        if (myPizzaIds.includes(p.id.toString())) {
            liveRegularPoints += getSum(p.beautyScores);
            liveRegularPoints += getSum(p.tasteScores);
            liveRegularPoints += getSum(p.beautyScoresDoce);
            liveRegularPoints += getSum(p.tasteScoresDoce);
            liveBonusPoints += getSum(p.bonusScores);
            liveBonusPoints += getSum(p.bonusScoresDoce);
        }
    });

    // Persistência de recordes para evitar perda de XP se notas mudarem
    const storageXpKey = `pizza_xp_reg_v2_${cleanNick}`;
    let storedMaxReg = parseFloat(localStorage.getItem(storageXpKey) || '0');
    if (liveRegularPoints > storedMaxReg) {
        localStorage.setItem(storageXpKey, liveRegularPoints.toString());
        storedMaxReg = liveRegularPoints;
    }

    const storageBonusKey = `pizza_xp_bonus_v3_${cleanNick}`;
    let storedMaxBonus = parseFloat(localStorage.getItem(storageBonusKey) || '0');
    if (liveBonusPoints > storedMaxBonus) {
        localStorage.setItem(storageBonusKey, liveBonusPoints.toString());
        storedMaxBonus = liveBonusPoints;
    }

    // 2. CÁLCULO DE ENGAJAMENTO SOCIAL (REGRAS SOLICITADAS)
    
    // LIKES (2.5% XP cada / 1 Ponto cada)
    // Soma curtidas em posts + curtidas em comentários + curtidas em respostas
    let likesGivenCount = 0;
    
    // Curtidas nos Posts principais
    likesGivenCount += Object.values(socialData.likes).reduce<number>((acc, mediaLikes: any) => acc + (mediaLikes[currentUser.nickname] ? 1 : 0), 0);
    
    // Curtidas nos Comentários e Respostas
    Object.values(socialData.comments).forEach((comments: any[]) => {
        comments.forEach(comment => {
            if (comment.reactions?.[currentUser.nickname]) likesGivenCount++;
            if (comment.replies) {
                comment.replies.forEach((reply: any) => {
                    if (reply.reactions?.[currentUser.nickname]) likesGivenCount++;
                });
            }
        });
    });

    // COMENTÁRIOS (2.5% XP / 1 Ponto - TRAVA: APENAS 1 POR POSTAGEM)
    let commentsGivenCount = 0;
    const mediaIdsVoted = new Set<string>();

    Object.entries(socialData.comments).forEach(([mediaId, comments]) => {
        // Verifica se o usuário tem comentário ou resposta nesta postagem específica
        const hasParticipated = comments.some(c => 
            c.user === currentUser.nickname || 
            (c.replies && c.replies.some((r: any) => r.user === currentUser.nickname))
        );
        
        if (hasParticipated) {
            mediaIdsVoted.add(mediaId);
        }
    });
    
    commentsGivenCount = mediaIdsVoted.size;

    // 3. CÁLCULO FINAL DE PROGRESSO
    const pizzaProgressPercent = storedMaxReg * 1.0; 
    const bonusProgressPercent = storedMaxBonus * 8.5; 
    const socialProgressPercent = (likesGivenCount * 2.5) + (commentsGivenCount * 2.5);
    
    let totalProgressPercent = pizzaProgressPercent + bonusProgressPercent + socialProgressPercent;
    
    // Aplica offsets se o XP tiver sido resetado pelo Admin
    const offsetKey = `pizza_xp_offset_${cleanNick}`;
    const xpOffset = parseFloat(localStorage.getItem(offsetKey) || '0');
    totalProgressPercent = Math.max(0, totalProgressPercent - xpOffset);

    let level = Math.floor(totalProgressPercent / 100) + 1;
    if (level > 5) level = 5;

    let currentBarProgress = totalProgressPercent % 100;
    if (level === 5) currentBarProgress = 100;

    // Pontos totais exibidos (Soma de tudo que vale 1 ponto)
    const totalDisplayPoints = storedMaxReg + storedMaxBonus + (likesGivenCount * 1.0) + (commentsGivenCount * 1.0);

    return { 
        level, 
        currentBarProgress, 
        totalPoints: Math.max(0, totalDisplayPoints - (xpOffset / 1.0)),
        likesGiven: likesGivenCount,
        commentsGiven: commentsGivenCount
    };
};
