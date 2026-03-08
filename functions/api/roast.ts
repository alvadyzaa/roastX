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
      generationConfig: { temperature: 1.0, maxOutputTokens: 8192 },
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
            return Response.json({ profile, roast: text, generatedAt: new Date().toISOString(), model });
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
