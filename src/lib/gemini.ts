import { XProfile } from "./nitter";

// Priority order — 2.5-flash first, then fallbacks
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function buildPrompt(profile: XProfile): string {
  const hasRatio =
    profile.followers &&
    profile.following &&
    profile.followers !== "0" &&
    profile.following !== "0";

  return `Kamu adalah komika stand-up paling savage di Indonesia yang khusus nge-roast profil Twitter/X orang.

TUGAS:
Buat roasting PEDAS, SARKASTIK, dan LUCU banget (gaya anak muda Jakarta/Gen-Z, pakai bahasa gaul Indonesia) untuk profil Twitter/X berikut ini.

DATA PROFIL:
- Nama: ${profile.name}
- Username: @${profile.username}
- Bio: ${profile.bio || "(kosong, gak ada bio sama sekali — ini udah roast sendiri sih)"}
- Followers: ${profile.followers || "gak diketahui"}
- Following: ${profile.following || "gak diketahui"}
- Total Tweet/Post: ${profile.tweetCount || "gak diketahui"}
- Bergabung sejak: ${profile.joinedDate || "gak diketahui"}
- Lokasi: ${profile.location || "disembunyiin (malu kali)"}
- Tweet yang di-pin: ${profile.pinnedTweet || "(gak ada pinned tweet — emang gak ada yang worth di-pin)"}
- Verified: ${profile.verified ? "Ya, centang biru" : "Kagak, miskin privilege"}
${hasRatio ? `- Rasio: ${profile.followers} followers vs ${profile.following} following` : ""}

ATURAN ROASTING:
1. Gunakan bahasa gaul Gen-Z kekinian: "literally", "bro", "anjir", "gila sih", "kok bisa", "auto", "frfr", "no cap", "gaskeun", dll
2. Roast SPESIFIK berdasarkan data yang ada — jangan generik
3. 3-4 paragraf pendek, tiap paragraf fokus pada satu aspek
4. JANGAN singgung agama, ras, suku, atau isu SARA — roast soal aktivitas X-nya aja
5. Akhiri dengan kalimat penutup yang menghibur tapi ada sedikit encouragement lucu
6. Tone: kayak temen yang lagi bully temen sendiri — bukan hate speech 😂

PENTING: Output HANYA teks roasting langsung tanpa intro/outro/disclaimer apapun.`;
}

// Direct REST fetch to Gemini — no SDK, fully edge-compatible
async function callGeminiRest(
  apiKey: string,
  modelName: string,
  prompt: string
): Promise<string | null> {
  const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string; code?: number };
  };

  if (!res.ok) {
    const msg = data.error?.message || `HTTP ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text && text.trim().length > 0 ? text.trim() : null;
}

export async function generateRoast(profile: XProfile, apiKeys: string[]): Promise<string> {
  const prompt = buildPrompt(profile);

  if (!apiKeys || apiKeys.length === 0) {
    throw new Error("Tidak ada API key yang dikonfigurasi.");
  }

  const errors: string[] = [];

  for (const apiKey of apiKeys) {
    for (const modelName of MODELS) {
      try {
        const text = await callGeminiRest(apiKey, modelName, prompt);

        if (!text) continue;

        console.log(`✓ Roast generated [key: ...${apiKey.slice(-6)}] [model: ${modelName}]`);
        return text;
      } catch (err) {
        const error = err as Error & { status?: number };
        const msg = error.message || "";
        const isQuota =
          error.status === 429 ||
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("RESOURCE_EXHAUSTED");
        const isNotFound = error.status === 404 || msg.includes("not found");

        console.warn(`FAIL key=...${apiKey.slice(-6)} model=${modelName}:`, msg.substring(0, 80));
        errors.push(`key=${apiKey.slice(-6)} model=${modelName}: ${isQuota ? "QUOTA" : isNotFound ? "NOT_FOUND" : "ERROR"}`);

        // If not quota — skip remaining models for this key
        if (!isQuota) break;
      }
    }
  }

  const allQuota = errors.length > 0 && errors.every((e) => e.includes("QUOTA"));
  if (allQuota) {
    throw new Error(
      "AI lagi overload nih bro 😅 Semua API key lagi rate limit. Coba lagi dalam beberapa menit ya!"
    );
  }

  throw new Error("AI gagal generate roasting. Coba lagi!");
}
