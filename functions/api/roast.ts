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
  GROQ_API_KEY_4?: string;
  GROQ_API_KEY_5?: string;
}

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

const GROQ_MODELS = [
  "llama3-70b-8192",
  "llama3-8b-8192",
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
        // Warning: Avoid doing heavy Intl/Date formatting as V8 Edge runtime might not have ICU data
        joinedDate = String(d.created_at).substring(0, 15);
      }

      let pic = (d.profile_image_url as string) || "";
      if (pic.includes("_normal.")) pic = pic.replace("_normal.", "_400x400.");

      return {
        name: d.name as string,
        username: (d.screen_name as string) || username,
        bio: (d.description as string) || "",
        followers: formatCount((d.followers_count as number) || 0),
        following: formatCount((d.following_count as number) || 0),
        tweetCount: formatCount((d.tweet_count as number) || 0),
        joinedDate,
        profilePicture: pic,
        verified: Boolean(d.verified) || ((d.followers_count as number) > 10000),
        pinnedTweet: "",
        location: (d.location as string) || "",
      };
    } catch { continue; }
  }
  return null;
}

// ── Build prompt ─────────────────────────────────────────────────────────────
function buildPrompt(p: Awaited<ReturnType<typeof fetchProfile>> & object) {
  const hasRatio = p!.followers !== "0" && p!.following !== "0";
  return `Kamu adalah komika stand-up paling savage di Indonesia yang khusus nge-roast profil Twitter/X orang.

TUGAS:
Buat roasting PEDAS, SARKASTIK, DETAIL, dan SUPER LUCU (gaya anak muda Jakarta/Gen-Z, pakai bahasa gaul Indonesia) untuk profil Twitter/X berikut ini.

DATA PROFIL:
- Nama: ${p!.name}
- Username: @${p!.username}
- Bio: ${p!.bio || "(kosong, gak ada bio sama sekali — ini udah roast sendiri sih)"}
- Followers: ${p!.followers || "gak diketahui"}
- Following: ${p!.following || "gak diketahui"}
- Total Tweet/Post: ${p!.tweetCount || "gak diketahui"}
- Bergabung sejak: ${p!.joinedDate || "gak diketahui"}
- Lokasi: ${p!.location || "disembunyiin (malu kali)"}
- Verified: ${p!.verified ? "Ya, centang biru" : "Kagak, miskin privilege"}
${hasRatio ? `- Rasio: ${p!.followers} followers vs ${p!.following} following` : ""}

ATURAN ROASTING:
1. Gunakan bahasa gaul Gen-Z kekinian: "literally", "bro", "anjir", "gila sih", "kok bisa", "auto", "frfr", "no cap", "gaskeun", dll
2. Roast SPESIFIK dan DALAM berdasarkan setiap data yang ada — jangan generik, gali lebih dalam
3. Tulis 5-6 paragraf yang padat dan panjang (minimal 3-4 kalimat per paragraf), tiap paragraf fokus pada satu aspek berbeda:
   - Paragraf 1: Username dan nama
   - Paragraf 2: Bio (atau ketiadaan bio)
   - Paragraf 3: Angka followers, following, dan rasionya
   - Paragraf 4: Total tweet dan frekuensi nge-tweet
   - Paragraf 5: Lokasi, tanggal join, dan verified status
   - Paragraf 6: Penutup sarkas tapi ada sedikit encouragement lucu
4. JANGAN singgung agama, ras, suku, atau isu SARA — roast soal aktivitas X-nya aja
5. Tone: kayak temen yang lagi bully temen sendiri tapi sayang — bukan hate speech 😂
6. WAJIB selesaikan semua 6 paragraf, jangan dipotong di tengah.

PENTING: Output HANYA teks roasting langsung tanpa intro/outro/disclaimer apapun. JANGAN berhenti di tengah kalimat.`;
}

// ── Call Gemini REST API ─────────────────────────────────────────────────────
async function callGemini(apiKey: string, model: string, prompt: string): Promise<string | null> {
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
      generationConfig: { temperature: 1.0, maxOutputTokens: 2048 },
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
  // If truncated mid-output, treat as failure so we can retry with next key
  if (finishReason === "MAX_TOKENS") return null;
  const text = candidate?.content?.parts?.[0]?.text;
  return text?.trim() || null;
}

// ── Call Groq REST API (Fallback) ────────────────────────────────────────────
async function callGroq(apiKey: string, model: string, prompt: string): Promise<string | null> {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      max_tokens: 1024,
    }),
  });

  const data = await res.json() as any;

  if (!res.ok) {
    const errorMsg = data.error?.message || `HTTP ${res.status}`;
    const err = new Error(`Groq: ${errorMsg}`) as any;
    err.status = res.status;
    throw err;
  }

  const text = data.choices?.[0]?.message?.content;
  return text?.trim() || null;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export const onRequestPost = async (context: EventContext<Env, any, any>) => {
  try {
    const req = context.request;
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseErr) {
      return Response.json({ error: "BAD_REQUEST", message: "Invalid JSON body" }, { status: 400 });
    }

    const username = String(body.username || "").replace(/^@/, "").trim();

    if (!username) {
      return Response.json({ error: "MISSING_USERNAME", message: "Username wajib diisi." }, { status: 400 });
    }

    // Load available API keys (MUST BE STATIC IN EDGE RUNTIME)
    const GEMINI_KEYS: string[] = [];
    const GROQ_KEYS: string[] = [];

    const rawGemini = [
        context.env.GEMINI_API_KEY_1,
        context.env.GEMINI_API_KEY_2,
        context.env.GEMINI_API_KEY_3,
        context.env.GEMINI_API_KEY_4,
        context.env.GEMINI_API_KEY_5,
    ];
    for (const gKey of rawGemini) {
        if (gKey && gKey.trim().length > 0 && !gKey.includes("AIzaSy...")) {
            GEMINI_KEYS.push(gKey.trim());
        }
    }

    const rawGroq = [
        context.env.GROQ_API_KEY_1,
        context.env.GROQ_API_KEY_2,
        context.env.GROQ_API_KEY_3,
        context.env.GROQ_API_KEY_4,
        context.env.GROQ_API_KEY_5,
    ];
    for (const grKey of rawGroq) {
        if (grKey && grKey.trim().length > 0) {
            GROQ_KEYS.push(grKey.trim());
        }
    }

    if (GEMINI_KEYS.length === 0 && GROQ_KEYS.length === 0) {
        return Response.json({ 
            error: "MISSING_CONFIG", 
            message: "Sedang maintenace: Konfigurasi API Key (Gemini/Groq) belum diset di Cloudflare Pages." 
        }, { status: 500 });
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
    const errors: string[] = [];

    // 1. Try Gemini Models first
    for (const key of GEMINI_KEYS) {
      for (const model of GEMINI_MODELS) {
        try {
          const text = await callGemini(key, model, prompt);
          if (text) {
            return Response.json({ profile, roast: text, generatedAt: new Date().toISOString(), model });
          }
        } catch (err) {
          const e = err as any;
          const isQuota = e.status === 429 || (e.message || "").includes("RESOURCE_EXHAUSTED");
          errors.push(`Gemini(...${key.slice(-6)}/${model}): ${isQuota ? "QUOTA" : String(e.message).substring(0, 50)}`);
          if (!isQuota && e.status !== 503) break; // skip to next key if not quota/overload
        }
      }
    }

    // 2. Fallback to Groq Models if Gemini failed
    if (GROQ_KEYS.length > 0) {
      for (const key of GROQ_KEYS) {
        for (const model of GROQ_MODELS) {
          try {
            const text = await callGroq(key, model, prompt);
            if (text) {
              return Response.json({ profile, roast: text, generatedAt: new Date().toISOString(), model });
            }
          } catch (err) {
            const e = err as any;
            const isQuota = e.status === 429;
            errors.push(`Groq(...${key.slice(-4)}/${model}): ${isQuota ? "QUOTA" : String(e.message).substring(0, 50)}`);
             if (!isQuota && e.status !== 503) break;
          }
        }
      }
    }

    const allQuota = errors.length > 0 && errors.every(e => e.includes("QUOTA"));
    if (allQuota) {
      return Response.json(
        { error: "QUOTA_EXCEEDED", message: "AI lagi overload nih 😅 Semua API key (Gemini & Groq) rate limit. Coba lagi nanti ya!" },
        { status: 429 }
      );
    }

    return Response.json({ 
      error: "AI_FAILED", 
      message: `AI gagal generate roasting:\n${errors.join("\n")}` 
    }, { status: 500 });

  } catch (err: any) {
    // Ultimate fallback to guarantee JSON response even if something horrible crashes in Edge.
    const msg = err && err.stack ? err.stack : String(err);
    return new Response(JSON.stringify({ 
        error: "EDGE_RUNTIME_CRASH", 
        message: msg 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
