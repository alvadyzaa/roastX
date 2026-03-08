import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, AlertCircle } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import RoastCard from "@/components/RoastCard";
import LoadingState from "@/components/LoadingState";
import Toast from "@/components/Toast";
import Navbar from "@/components/Navbar";
import VisitorCounter from "@/components/VisitorCounter";
import ApiQuotaModal from "@/components/ApiQuotaModal";
import WelcomeModal from "@/components/WelcomeModal";
import { XProfile } from "@/lib/nitter";

const XIcon = ({ size = "1em", className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" fill="currentColor"/>
  </svg>
);

interface RoastResult {
  profile: XProfile;
  roast: string;
  model?: string;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showQuotaError, setShowQuotaError] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === "undefined") return true;
    const storedDate = localStorage.getItem("roastx_welcome_hidden_date");
    const today = new Date().toISOString().split("T")[0];
    return storedDate !== today;
  });
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We increment a simple counter API for roastx.
    // Namespace: roastx_new, key: hits (starting fresh from 0)
    fetch("https://api.counterapi.dev/v1/roastx_new/hits/up")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.count) {
          setVisitorCount(data.count);
        }
      })
      .catch(() => {
        // Fallback or silent fail if api is blocked
        setVisitorCount(1);
      });
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmed = username.replace(/^@/, "").trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      let data;
      const textResponse = await res.text();
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        // If not JSON (e.g. Cloudflare HTML 500 page)
        console.error("Non-JSON response:", textResponse.substring(0, 200));
        throw new Error(`Server Error (${res.status}): API mengembalikan respons tidak valid.`);
      }

      if (!res.ok) {
        if (res.status === 429 || data.message?.toLowerCase().includes("quota") || data.message?.toLowerCase().includes("limit") || data.message?.toLowerCase().includes("exhausted")) {
          setShowQuotaError(true);
        } else {
          setError(data.message || `Error ${res.status}: Terjadi kesalahan.`);
        }
        return;
      }

      setResult({ profile: data.profile, roast: data.roast, model: data.model });

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Koneksi gagal. Periksa internet lo dan coba lagi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  return (
    <>
      {/* Background glow orbs */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      {/* Navbar */}
      <Navbar onShowApiQuotaError={() => setShowQuotaError(true)} />

      <main>
        {/* Hero */}
        <section className="hero">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="hero-eyebrow">
              <motion.div
                className="animate-flame"
              >
                <Flame size={14} />
              </motion.div>
              {visitorCount ? `Udah ${visitorCount.toLocaleString()} orang yang sudah di Roast` : "Menghitung korban Roast..."}
            </span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Roast profil{" "}
            <span className="gradient-text inline-flex items-center gap-2 align-bottom">
               <XIcon size="0.85em" /> mu
            </span>{" "}
            pake AI <span className="animate-flame ml-1 inline-block">🔥</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Masukkan username Twitter/X, dan biarkan AI nge-roast profil yang pedas abis. Siap-siap baper! 😂
          </motion.p>

          {/* Input */}
          <motion.div
            className="input-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <form onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <span className="input-prefix">@</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="input-field"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={50}
                  id="username-input"
                  aria-label="Masukkan username Twitter/X"
                />
                <button
                  type="submit"
                  className="btn-roast"
                  disabled={loading || !username.trim()}
                  id="roast-button"
                  aria-label="Roast sekarang"
                >
                  {loading ? (
                    <>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Flame size={16} />
                      <span>Roast!</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="error-box"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{ marginTop: 12 }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <div className="results-section">
              <LoadingState />
            </div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <div ref={resultRef} className="results-section">
              <ProfileCard profile={result.profile} />
              <RoastCard
                roast={result.roast}
                username={result.profile.username}
                model={result.model}
                onCopy={() => showToast("Roasting berhasil di-copy! 🔥")}
              />

              {/* Roast again button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ textAlign: "center", paddingTop: 8 }}
              >
                <button
                  className="btn-action"
                  onClick={() => {
                    setResult(null);
                    setUsername("");
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  id="roast-again-button"
                >
                  <span className="animate-flame inline-flex align-bottom"><Flame size={15} /></span>
                  <span>Roast username lain</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="footer relative z-10">
        <VisitorCounter count={visitorCount} />
        <p>
          Made by{" "}
          <a href="https://x.com/miegrains" target="_blank" rel="noopener noreferrer">
            Keith
          </a>
        </p>
      </footer>

      <ApiQuotaModal isOpen={showQuotaError} onClose={() => setShowQuotaError(false)} />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
