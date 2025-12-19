
import { UserAccount, PizzaData, SocialData, getSum } from '../types';

/**
 * Calcula o nível e XP do usuário baseado nos dados ATUAIS.
 * Regra: 
 * 1. O Chef recebe XP pelas notas recebidas (1.0% por ponto).
 * 2. O Jurado que APLICA a estrela (bônus) ganha 8,5% de XP e 1 ponto.
 * 3. Likes e Comentários dão 2.5% de XP e 1 ponto.
 */
export const calculateUserLevel = (
    currentUser: UserAccount | null, 
    pizzas: PizzaData[], 
    socialData: SocialData, 
    pizzaOwners: Record<number, string>
) => {
    if (!currentUser) return { level: 1, currentBarProgress: 0, totalPoints: 0, likesGiven: 0, commentsGiven: 0, rawProgress: 0, totalDisplayPointsRaw: 0 };

    const cleanNick = currentUser.nickname.replace('@', '').trim();
    
    // 1. PONTOS TÉCNICOS (Chef)
    const myPizzaIds = Object.entries(pizzaOwners)
        .filter(([_, ownerName]) => String(ownerName).trim().toLowerCase() === cleanNick.toLowerCase())
        .map(([id, _]) => id);

    let currentRegularPoints = 0;
    let currentReceivedBonusPoints = 0;

    pizzas.forEach(p => {
        if (myPizzaIds.includes(p.id.toString())) {
            currentRegularPoints += getSum(p.beautyScores) + getSum(p.tasteScores);
            currentRegularPoints += getSum(p.beautyScoresDoce) + getSum(p.tasteScoresDoce);
            currentReceivedBonusPoints += getSum(p.bonusScores) + getSum(p.bonusScoresDoce);
        }
    });

    // 2. PONTOS SOCIAIS (Jurado)
    
    // Estrelas Aplicadas (8.5% XP cada / 1 Ponto cada)
    let bonusesGivenCount = 0;
    pizzas.forEach(p => {
        if (p.bonusScores?.[currentUser.nickname] === 1) bonusesGivenCount++;
        if (p.bonusScoresDoce?.[currentUser.nickname] === 1) bonusesGivenCount++;
    });

    // Likes (2.5% XP / 1 Ponto)
    let likesGivenCount = 0;
    likesGivenCount += Object.values(socialData.likes).reduce<number>((acc, mediaLikes: any) => acc + (mediaLikes[currentUser.nickname] ? 1 : 0), 0);
    
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

    // Comentários (2.5% XP / 1 Ponto - limite 1 por postagem)
    let commentsGivenCount = 0;
    const mediaIdsWithComments = new Set<string>();
    Object.entries(socialData.comments).forEach(([mediaId, comments]) => {
        const hasParticipated = comments.some(c => c.user === currentUser.nickname || (c.replies && c.replies.some((r: any) => r.user === currentUser.nickname)));
        if (hasParticipated) mediaIdsWithComments.add(mediaId);
    });
    commentsGivenCount = mediaIdsWithComments.size;

    // 3. CÁLCULO FINAL
    const pizzaProgressPercent = currentRegularPoints * 1.0; 
    const bonusReceivedProgressPercent = currentReceivedBonusPoints * 8.5; 
    const bonusGivenProgressPercent = bonusesGivenCount * 8.5;
    const socialProgressPercent = (likesGivenCount * 2.5) + (commentsGivenCount * 2.5);
    
    const rawProgress = pizzaProgressPercent + bonusReceivedProgressPercent + bonusGivenProgressPercent + socialProgressPercent;
    
    // XP Offset para Nível - Força reset absoluto se os valores coincidirem
    const xpOffset = (typeof currentUser.xpOffset === 'number') ? currentUser.xpOffset : 0;
    let totalProgressPercent = rawProgress - xpOffset;
    if (totalProgressPercent < 0.01) totalProgressPercent = 0;

    // Nível (Max 5)
    let level = Math.floor(totalProgressPercent / 100) + 1;
    if (level > 5) level = 5;

    let currentBarProgress = totalProgressPercent % 100;
    if (level === 5) currentBarProgress = 100;

    // Pontos Offset para Total Exibido - Força reset absoluto
    const totalDisplayPointsRaw = currentRegularPoints + currentReceivedBonusPoints + bonusesGivenCount + likesGivenCount + commentsGivenCount;
    const pointsOffset = (typeof currentUser.pointsOffset === 'number') ? currentUser.pointsOffset : 0;
    let totalPoints = totalDisplayPointsRaw - pointsOffset;
    if (totalPoints < 0.01) totalPoints = 0;

    return { 
        level, 
        currentBarProgress, 
        totalPoints, 
        likesGiven: likesGivenCount,
        commentsGiven: commentsGivenCount,
        rawProgress,
        totalDisplayPointsRaw
    };
};
