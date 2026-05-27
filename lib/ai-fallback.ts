import { GoogleGenAI, type Content, type GenerateContentConfig } from "@google/genai";

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Mengambil daftar API Key Gemini yang tersedia
const getGeminiKeys = () => {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2
  ].map((key) => key?.trim()).filter((key): key is string => typeof key === "string" && key !== "");
};

// Model text-out yang tersedia. Urutan dari yang paling ringan ke yang lebih berat.
const DEFAULT_GEMINI_MODELS = [
  "gemini-3.1-flash-lite", // Prioritas utama karena limitnya tinggi (500 RPD)
  "gemini-3.1-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const getGeminiModels = () => {
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  return Array.from(
    new Set([configuredModel, ...DEFAULT_GEMINI_MODELS].filter((model): model is string => Boolean(model))),
  );
};

// Memeriksa apakah input mengandung data gambar (untuk OCR nota)
function hasImageData(contents: Content[]): boolean {
  return contents.some((content) =>
    content.parts?.some((part) => "inlineData" in part || "fileData" in part)
  );
}

// Konversi format konten Gemini ke format OpenAI
function convertGeminiToOpenAI(contents: Content[], config?: GenerateContentConfig) {
  let systemMessage = "";
  const systemInstruction = config?.systemInstruction;
  if (typeof systemInstruction === "string") {
    systemMessage = systemInstruction;
  } else if (Array.isArray(systemInstruction)) {
    systemMessage = systemInstruction.join("\n");
  }

  const messages: OpenAIMessage[] = [];
  if (systemMessage) {
    messages.push({ role: "system", content: systemMessage });
  }

  for (const item of contents) {
    const role = item.role === "model" ? "assistant" : "user";
    let textContent = "";
    if (Array.isArray(item.parts)) {
      for (const part of item.parts) {
        if ("text" in part && part.text) {
          textContent += part.text + "\n";
        }
      }
    }
    messages.push({ role, content: textContent.trim() });
  }

  return messages;
}

// Pemanggilan API OpenAI/OpenRouter/Nvidia menggunakan standard fetch
async function callOpenAICompatible(params: {
  url: string;
  apiKey: string;
  model: string;
  messages: OpenAIMessage[];
  schema?: unknown;
}): Promise<string> {
  const { url, apiKey, model, messages, schema } = params;

  const processedMessages = [...messages];
  if (schema && processedMessages.length > 0) {
    const lastMsg = processedMessages[processedMessages.length - 1];
    lastMsg.content = `${lastMsg.content}\n\nIMPORTANT: You MUST respond strictly in valid JSON format conforming to the following JSON schema:\n${JSON.stringify(schema)}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: processedMessages,
      response_format: schema ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from API.");
  }
  return content;
}

/**
 * Generator Konten Terpadu dengan 5-Layer Fallback:
 * Layer 1: Gemini API Key 1 (Semua Model)
 * Layer 2: Gemini API Key 2 (Semua Model)
 * Layer 3: OpenRouter (Free Models)
 * Layer 4: OpenAI (gpt-4o-mini)
 * Layer 5: Nvidia NIM (Llama 3.1)
 */
export async function generateContentWithFallback(params: {
  config: GenerateContentConfig;
  contents: Content[];
}): Promise<{ text: string; model: string }> {
  let lastError: unknown = null;
  const isVision = hasImageData(params.contents);

  // ─── LAYER 1 & 2: Gemini API Keys ───
  const geminiKeys = getGeminiKeys();
  if (geminiKeys.length > 0) {
    for (const key of geminiKeys) {
      const ai = new GoogleGenAI({ apiKey: key });
      for (const model of getGeminiModels()) {
        try {
          const response = await ai.models.generateContent({
            model,
            config: params.config,
            contents: params.contents,
          });
          return { text: response.text || "{}", model: `gemini/${model}` };
        } catch (err) {
          lastError = err;
        }
      }
    }
  }

  // Jika input mengandung gambar (OCR struk), kita tidak fall back ke provider non-multimodal
  if (isVision) {
    throw lastError ?? new Error("All Gemini models and API keys failed on multimodal task.");
  }

  // ─── LAYER 3: OpenRouter ───
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    const openRouterModels = ["openrouter/free", "google/gemini-2.5-flash:free", "meta-llama/llama-3.2-3b-instruct:free", "openrouter/auto"];
    const messages = convertGeminiToOpenAI(params.contents, params.config);
    for (const model of openRouterModels) {
      try {
        const text = await callOpenAICompatible({
          url: "https://openrouter.ai/api/v1/chat/completions",
          apiKey: openRouterKey,
          model,
          messages,
          schema: params.config?.responseSchema,
        });
        return { text, model: `openrouter/${model}` };
      } catch (err) {
        lastError = err;
      }
    }
  }

  // ─── LAYER 4: OpenAI ───
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  if (openAIKey) {
    const openAIModels = ["gpt-4o-mini", "gpt-4o"];
    const messages = convertGeminiToOpenAI(params.contents, params.config);
    for (const model of openAIModels) {
      try {
        const text = await callOpenAICompatible({
          url: "https://api.openai.com/v1/chat/completions",
          apiKey: openAIKey,
          model,
          messages,
          schema: params.config?.responseSchema,
        });
        return { text, model: `openai/${model}` };
      } catch (err) {
        lastError = err;
      }
    }
  }

  // ─── LAYER 5: Nvidia NIM ───
  const nvidiaKey = process.env.NVIDIA_API_KEY?.trim();
  if (nvidiaKey) {
    const nvidiaModels = ["meta/llama-3.1-70b-instruct", "meta/llama-3.1-8b-instruct"];
    const messages = convertGeminiToOpenAI(params.contents, params.config);
    for (const model of nvidiaModels) {
      try {
        const text = await callOpenAICompatible({
          url: "https://integrate.api.nvidia.com/v1/chat/completions",
          apiKey: nvidiaKey,
          model,
          messages,
          schema: params.config?.responseSchema,
        });
        return { text, model: `nvidia/${model}` };
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError ?? new Error("All AI fallback options failed.");
}
