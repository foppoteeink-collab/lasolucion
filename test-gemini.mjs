import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({
  apiKey: "AQ.Ab8RN6JitrgdI4qrobs4gxzdbZ2rlinGzFYaNN61NBD1DNTsNA",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});
try {
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: 'hola'
  });
  console.log("Success:", response.text);
} catch (err) {
  console.error("Error:", err);
}
