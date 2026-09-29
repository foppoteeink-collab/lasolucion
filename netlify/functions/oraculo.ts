export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY in Netlify environment variables" })
      };
    }

    const { prompt, model } = JSON.parse(event.body || '{}');
    if (!prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing prompt" }) };
    }

    // Try these models in order until one works
    const candidateModels = [
      model || 'gemini-1.5-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
    ].filter((m, i, arr) => arr.indexOf(m) === i); // deduplicate

    for (const targetModel of candidateModels) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { statusCode: 200, headers, body: JSON.stringify(data) };
        }
      } else {
        const errText = await response.text();
        console.warn(`[oraculo] Model ${targetModel} failed: ${response.status} - ${errText}`);
      }
    }

    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: "All Gemini models unavailable" })
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
