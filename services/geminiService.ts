import { GoogleGenAI, Type } from "@google/genai";
import { PizzaData, getAverage } from "../types";

export const getJudgeAnalysis = async (pizzas: PizzaData[]): Promise<string> => {
  // Check for API key in environment variables
  if (!process.env.API_KEY) {
    return "A chave da API está ausente. Por favor, configure seu ambiente.";
  }

  // Initialize Gemini Client using process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Calculate averages for the AI
  const summarizedPizzas = pizzas.map(p => ({
    id: p.id,
    beautyScore: getAverage(p.beautyScores),
    tasteScore: getAverage(p.tasteScores)
  })).filter(p => p.beautyScore > 0 || p.tasteScore > 0);

  if (summarizedPizzas.length === 0) {
    return "Nenhuma pizza foi avaliada ainda. Comece a provar para obter uma análise!";
  }

  const prompt = `
    Você é um juiz culinário espirituoso e profissional em uma competição de pizza.
    Aqui estão os dados atuais de pontuação MÉDIA dos juízes (escala de 0-10 para Beleza e Sabor):
    ${JSON.stringify(summarizedPizzas, null, 2)}

    Por favor, forneça um comentário breve e envolvente (máx. 150 palavras) sobre a classificação atual. 
    Destaque o líder, quaisquer discrepâncias interessantes entre aparência e sabor (por exemplo, "feia mas deliciosa") e incentive os juízes.
    Responda em PORTUGUÊS.
    Formate a resposta como uma string markdown simples.
  `;

  try {
    // Fix: Updated model to 'gemini-3-flash-preview' as it is the recommended model for basic text tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        systemInstruction: "Você é um crítico gastronômico carismático como Gordon Ramsay, mas mais simpático.",
      },
    });

    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "O juiz está em um intervalo para o café (Erro de API). Por favor, tente novamente mais tarde.";
  }
};