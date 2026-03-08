import type { EventContext } from "@cloudflare/workers-types";

export interface Env {
  GEMINI_API_KEY_1?: string;
  GEMINI_API_KEY_2?: string;
  GEMINI_API_KEY_3?: string;
  GEMINI_API_KEY_4?: string;
  GEMINI_API_KEY_5?: string;
}

const GEMINI_MODELS = [
  "gemini-2.5-flash",
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
  return `Roast profil Twitter/X ini sepedas mungkin pakai bahasa gaul Gen-Z (Indonesia). SPESIFIK ke datanya. Buat 2-3 paragraf dengan panjang sedang (jangan terlalu pendek cuma 1-2 kalimat, tapi jangan terlalu panjang juga). JANGN bahas SARA/agama.
DATA:
- Nama: ${p!.name} | Username: @${p!.username}
- Bio: ${p!.bio || "grup wa keluarga aja males invite dia"}
- Followers: ${p!.followers || "0"} | Following: ${p!.following || "0"}
- Tweet: ${p!.tweetCount || "0"} | Join: ${p!.joinedDate || "?"} | Verified: ${p!.verified ? "Ya" : "Enggak"}
${hasRatio ? `- Rasio F/F: ${p!.followers}/${p!.following}` : ""}

Tulis langsung roastingnya tanpa intro/outro.`;
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
      generationConfig: { temperature: 1.0, maxOutputTokens: 1024 },
    }),
  });

  const data = await res.json() as any;

  if (!res.ok) {
    // Determine if it was a safety block
    if (data.error?.message?.includes("finishReason: SAFETY")) {
        throw new Error("BLOCKED_BY_SAFETY");
    }
    const errorMsg = data.error?.message || `HTTP ${res.status}`;
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    throw err;
  }

  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  // If safety blocked, treat as error. But if MAX_TOKENS, allow returning what we have.
  if (finishReason === "SAFETY") {
      throw new Error(`TRUNCATED_OR_UNSAFE_${finishReason}`);
  }
  const text = candidate?.content?.parts?.[0]?.text;
  return text?.trim() || null;
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

    // ── CACHE CHECK (Cloudflare Cache API) ──────────────────────────────────
    // Creating a dummy Request so we can use Cache API which only accepts HTTP Requests as keys
    const cacheUrl = new URL(req.url);
    cacheUrl.pathname = `/roast-cache/${username.toLowerCase()}`;
    const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
    const cache = (caches as any).default;
    
    try {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        return cachedResponse; // Return heavily optimized cached result immediately!
      }
    } catch (e) {
      // ignore cache errors just fall through
    }

    // Load available API keys (MUST BE STATIC IN EDGE RUNTIME)
    const GEMINI_KEYS: string[] = [];

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

    if (GEMINI_KEYS.length === 0) {
        return Response.json({ 
            error: "MISSING_CONFIG", 
            message: "Sedang maintenace: Konfigurasi API Key Gemini belum diset di Cloudflare Pages." 
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
            const finalResponse = Response.json({ profile, roast: text, generatedAt: new Date().toISOString(), model });
            
            // Save to Cache for 24 hours (86400 seconds)
            try {
              const resToCache = new Response(finalResponse.clone().body, finalResponse);
              resToCache.headers.set("Cache-Control", "public, max-age=86400");
              context.waitUntil(cache.put(cacheKey, resToCache));
            } catch (ce) {
               // Ignore cache write errors
            }
            
            return finalResponse;
          }
        } catch (err) {
          const e = err as any;
          const msg = e.message || String(e);
          const isQuota = e.status === 429; // Only strict 429 is a quota issue
          
          if (msg.includes("SAFETY")) {
             errors.push(`Gemini(${model}): SAFETY_BLOCK`);
          } else {
             // Log the EXACT error from Gemini so we know WHY it failed
             errors.push(`Gemini(${model}) HTTP ${e.status || 'unknown'}: ${msg.substring(0, 100)}`);
          }
          
          if (!isQuota && e.status !== 503 && !msg.includes("SAFETY")) break; // skip to next key if not quota/overload/safety
        }
      }
    }

    const allQuota = errors.length > 0 && errors.every(e => e.includes("HTTP 429"));
    if (allQuota) {
      return Response.json(
        { error: "QUOTA_EXCEEDED", message: "AI lagi overload nih 😅 Semua API key Gemini kena rate limit (HTTP 429). Coba lagi nanti ya!" },
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
