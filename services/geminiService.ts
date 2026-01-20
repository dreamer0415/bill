
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractInvoiceData = async (base64Image: string): Promise<Partial<Invoice>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "請分析這張發票並提取以下資訊：日期 (YYYY/MM/DD)、發票號碼、賣方名稱、總金額。如果有多個項目也請提取明細。請以繁體中文回答。",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: '發票日期格式 YYYY/MM/DD' },
            number: { type: Type.STRING, description: '發票號碼' },
            vendor: { type: Type.STRING, description: '商家名稱' },
            totalAmount: { type: Type.NUMBER, description: '總金額' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: '品項名稱' },
                  quantity: { type: Type.NUMBER, description: '數量' },
                  price: { type: Type.NUMBER, description: '單價' },
                },
                required: ['name', 'quantity', 'price'],
              },
            },
          },
          required: ['date', 'number', 'vendor', 'totalAmount'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};
