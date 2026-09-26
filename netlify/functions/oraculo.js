// Netlify Function: oraculo
// Proxy seguro para la API de Gemini. La API key nunca se expone al cliente.

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
];

exports.handler = async function (event, context) {
  // Solo acepta POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GEMINI_API_KEY not configured in Netlify environment variables." }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { prompt, model } = body;
  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'prompt' in request body" }),
    };
  }

  // Determina qué modelos intentar
  const modelsToTry = model ? [model, ...CANDIDATE_MODELS.filter(m => m !== model)] : CANDIDATE_MODELS;

  const requestPayload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  for (const modelName of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          // Devuelve el mismo formato que la API de Gemini espera el cliente
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify(data),
          };
        }
      } else {
        const errText = await response.text();
        console.warn(`[oraculo] Model ${modelName} failed with HTTP ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn(`[oraculo] Model ${modelName} threw error:`, err.message);
    }
  }

  return {
    statusCode: 503,
    body: JSON.stringify({ error: "All Gemini models unavailable or returned empty response." }),
  };
};
