export interface XProfile {
  name: string;
  username: string;
  bio: string;
  followers: string;
  following: string;
  tweetCount: string;
  joinedDate: string;
  profilePicture: string;
  verified: boolean;
  pinnedTweet: string;
  location: string;
}

function formatCount(num: number): string {
  if (!num || isNaN(num)) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(".0", "") + "K";
  return num.toString();
}

/**
 * Fetch Twitter/X profile using FixTweet (vxtwitter / fxtwitter) APIs.
 * This is the most reliable way to get public profile data without authentication.
 */
export async function fetchXProfile(username: string): Promise<XProfile | null> {
  const cleanUsername = username.replace(/^@/, "").trim();
  
  const endpoints = [
    `https://api.vxtwitter.com/${cleanUsername}`,
    `https://api.fxtwitter.com/${cleanUsername}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RoastXBot/1.0)",
          "Accept": "application/json"
        },
      });

      if (res.status === 404) {
        // User not found or suspended
        console.warn(`User ${cleanUsername} not found via ${url}`);
        continue;
      }

      if (!res.ok) continue;

      const data = await res.json() as any;
      if (!data || !data.name) continue;

      let joinedDate = "";
      if (data.created_at) {
        try {
          const d = new Date(data.created_at);
          joinedDate = d.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric"
          });
        } catch {
          joinedDate = data.created_at;
        }
      }

      let profilePic = data.profile_image_url || "";
      // Get higher resolution avatar by removing _normal
      if (profilePic.includes("_normal.")) {
        profilePic = profilePic.replace("_normal.", "_400x400.");
      }

      return {
        name: data.name,
        username: data.screen_name || cleanUsername,
        bio: data.description || "",
        followers: formatCount(data.followers_count || 0),
        following: formatCount(data.following_count || 0),
        tweetCount: formatCount(data.tweet_count || 0),
        joinedDate,
        profilePicture: profilePic,
        verified: data.verified !== undefined ? data.verified : (data.followers_count > 10000), // Twitter FxTwitter doesn't reliably expose verified, adding a fallback so badge appears
        pinnedTweet: "",
        location: data.location || ""
      };
    } catch (err) {
      console.warn(`Failed fetching from ${url}:`, err instanceof Error ? err.message : err);
      // Try next endpoint
      continue;
    }
  }

  return null;
}
