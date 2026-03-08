import type { EventContext } from "@cloudflare/workers-types";

export interface Env {
  GEMINI_API_KEY_1?: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_API_KEY_3?: string;
  GEMINI_API_KEY_4?: string;
  GEMINI_API_KEY_5?: string;
  GROQ_API_KEY_1?: string;
  GROQ_API_KEY_2?: string;
  GROQ_API_KEY_3?: string;
}

// Models ordered by quality — fallback down the list on quota
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "mixtral-8x7b-32768",
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCount(num: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(".0", "") + "K";
  return num.toString();
}

// ── Fetch Twitter profile (vxtwitter → fxtwitter fallback) ───────────────────
async function fetchProfile(username: string) {
  const endpoints = [
    `https://api.vxtwitter.com/${username}`,
    `https://api.fxtwitter.com/${username}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "RoastXBot/1.0", Accept: "application/json" },
      });
      if (!res.ok) continue;

      const d = await res.json() as Record<string, unknown>;
      if (!d || !d.name) continue;

      let joinedDate = "";
      if (d.created_at) {
        try {
          const dt = new Date(d.created_at as string);
          const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          joinedDate = `${months[dt.getMonth()]} ${dt.getFullYear()}`;
        } catch {
          joinedDate = String(d.created_at).substring(0, 10);
        }
      }

      let pic = (d.profile_image_url as string) || "";
      if (pic.includes("_normal.")) pic = pic.replace("_normal.", "_400x400.");

      const isVerified =
        Boolean(d.is_blue_verified) ||
        Boolean(d.verified) ||
        d.verified_type === "Business" ||
        d.verified_type === "Government" ||
        (typeof d.verified_type === "string" && d.verified_type.length > 0);

      return {
        name: d.name as string,
        username: (d.screen_name as string) || username,
        bio: (d.description as string) || "",
        followers: formatCount((d.followers_count as number) || 0),
        following: formatCount((d.following_count as number) || 0),
        tweetCount: formatCount((d.tweet_count as number) || 0),
        joinedDate,
        profilePicture: pic,
        verified: isVerified,
        pinnedTweet: "",
        location: (d.location as string) || "",
      };
    } catch { continue; }
  }
  return null;
}

// ── Build prompt ─────────────────────────────────────────────────────────────
function buildPrompt(p: Awaited<ReturnType<typeof fetchProfile>> & object, short = false) {
  const hasRatio = p!.followers !== "0" && p!.following !== "0";
  if (short) {
    return `Roast @${p!.username} (${p!.name}) pakai bahasa gaul Gen-Z Indonesia, sepedas mungkin. Bio: "${p!.bio || "kosong"}". Followers ${p!.followers}, Following ${p!.following}, ${p!.tweetCount} tweet, join ${p!.joinedDate}. Tulis TEPAT 2 paragraf pendek. Selesaikan sampai titik terakhir. Jangan SARA.`;
  }
  return `Roast profil Twitter/X ini pakai bahasa gaul Gen-Z Indonesia, sepedas dan setajam mungkin. Fokus SPESIFIK ke data di bawah.
Tulis TEPAT 2 paragraf. Tiap paragraf 3-4 kalimat pendek. WAJIB selesai sampai tanda titik/seru terakhir — JANGAN terpotong. Jangan bahas SARA/agama.
DATA:
- Nama: ${p!.name} | @${p!.username}
- Bio: "${p!.bio || "grup wa keluarga aja males invite dia"}"
- Followers: ${p!.followers} | Following: ${p!.following} | Tweet: ${p!.tweetCount}
- Join: ${p!.joinedDate || "?"} | Verified: ${p!.verified ? "Ya (Twitter Blue/Centang Biru)" : "Tidak"}
${hasRatio ? `- Rasio followers/following: ${p!.followers}/${p!.following}` : ""}

Langsung tulis roastingnya. Akhiri kalimat terakhir dengan tanda baca.`;
}

// ── Call Gemini REST API ─────────────────────────────────────────────────────
async function callGemini(apiKey: string, model: string, prompt: string, maxTokens = 500): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
      generationConfig: { temperature: 1.0, maxOutputTokens: maxTokens },
    }),
  });

  const data = await res.json() as any;

  if (!res.ok) {
    const errorMsg = data.error?.message || `HTTP ${res.status}`;
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    throw err;
  }

  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason === "SAFETY") throw new Error("SAFETY");
  if (finishReason === "MAX_TOKENS") throw new Error("MAX_TOKENS");

  const text = candidate?.content?.parts?.[0]?.text;
  return text?.trim() || null;
}

// ── Call Groq REST API ───────────────────────────────────────────────────────
async function callGroq(apiKey: string, model: string, prompt: string): Promise<string | null> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      max_tokens: 500,
    }),
  });

  const data = await res.json() as any;
  if (!res.ok) {
    const err = new Error(data.error?.message || `HTTP ${res.status}`) as any;
    err.status = res.status;
    throw err;
  }

  return data.choices?.[0]?.message?.content?.trim() || null;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export const onRequestPost = async (context: EventContext<Env, any, any>) => {
  try {
    const req = context.request;
    let body;
    try {
      body = (await req.clone().json()) as any;
    } catch (parseErr: any) {
      return Response.json({ error: "BAD_REQUEST", message: "Invalid JSON body: " + parseErr.message }, { status: 400 });
    }

    const username = String(body.username || "").replace(/^@/, "").trim();
    if (!username) {
      return Response.json({ error: "MISSING_USERNAME", message: "Username wajib diisi." }, { status: 400 });
    }

    // Load API keys
    const GEMINI_KEYS: string[] = [];
    const GROQ_KEYS: string[] = [];

    for (const k of [context.env.GEMINI_API_KEY_1, context.env.GEMINI_API_KEY_2, context.env.GEMINI_API_KEY_3, context.env.GEMINI_API_KEY_4, context.env.GEMINI_API_KEY_5]) {
      if (k && k.trim() && !k.includes("...")) GEMINI_KEYS.push(k.trim());
    }
    for (const k of [context.env.GROQ_API_KEY_1, context.env.GROQ_API_KEY_2, context.env.GROQ_API_KEY_3]) {
      if (k && k.trim()) GROQ_KEYS.push(k.trim());
    }

    if (GEMINI_KEYS.length === 0 && GROQ_KEYS.length === 0) {
      return Response.json({ error: "MISSING_CONFIG", message: "Sedang maintenance: API Key belum dikonfigurasi." }, { status: 500 });
    }

    // Fetch profile
    const profile = await fetchProfile(username);
    if (!profile) {
      return Response.json(
        { error: "USER_NOT_FOUND", message: `@${username} tidak ditemukan atau akunnya private/suspended.` },
        { status: 404 }
      );
    }

    const prompt = buildPrompt(profile);
    const promptShort = buildPrompt(profile, true);
    const errors: string[] = [];

    // ── Try Gemini (key × model matrix) ──────────────────────────────────────
    // Strategy: try each model for each key before exhausting a key
    // This maximizes chance because different models have separate RPM buckets
    for (const model of GEMINI_MODELS) {
      for (const key of GEMINI_KEYS) {
        try {
          const text = await callGemini(key, model, prompt);
          if (text) return Response.json({ profile, roast: text, generatedAt: new Date().toISOString(), model });
        } catch (err) {
          const e = err as any;
          const msg = e.message || String(e);
          const status = e.status as number;

          if (status === 429 || status === 403) {
            errors.push(`Gemini/${model}/...${key.slice(-4)}: ${status}`);
            continue; // try next key for same model
          }
          if (msg === "MAX_TOKENS") {
            // Retry with shorter prompt
            try {
              const short = await callGemini(key, model, promptShort, 350);
              if (short) return Response.json({ profile, roast: short, generatedAt: new Date().toISOString(), model });
            } catch { /* fall through */ }
            continue;
          }
          if (msg === "SAFETY") { errors.push(`Gemini/${model}: SAFETY`); continue; }
          errors.push(`Gemini/${model}/...${key.slice(-4)}: ${msg.substring(0, 80)}`);
        }
      }
    }

    // ── Fallback: Groq ────────────────────────────────────────────────────────
    for (const model of GROQ_MODELS) {
      for (const key of GROQ_KEYS) {
        try {
          const text = await callGroq(key, model, prompt);
          if (text) return Response.json({ profile, roast: text, generatedAt: new Date().toISOString(), model: `groq/${model}` });
        } catch (err) {
          const e = err as any;
          errors.push(`Groq/${model}: ${e.status || e.message?.substring(0, 50)}`);
        }
      }
    }

    // ── All providers failed ──────────────────────────────────────────────────
    const allQuota = errors.length > 0 && errors.every(e => e.includes("429") || e.includes("403"));
    if (allQuota) {
      return Response.json(
        { error: "QUOTA_EXCEEDED", message: "AI sedang overload 😴 Semua provider kena rate limit. Coba lagi dalam beberapa menit ya!" },
        { status: 429 }
      );
    }

    return Response.json({
      error: "AI_FAILED",
      message: `AI gagal generate roasting. Detail: ${errors.join("; ")}`
    }, { status: 500 });

  } catch (err: any) {
    const msg = err?.stack ? err.stack : String(err);
    return new Response(JSON.stringify({ error: "EDGE_RUNTIME_CRASH", message: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
