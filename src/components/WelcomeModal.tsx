"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Info } from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "roastx_welcome_hidden_date";

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [dontShowToday, setDontShowToday] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    if (dontShowToday) {
      const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
      localStorage.setItem(STORAGE_KEY, today);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop" onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="modal-content welcome-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button className="modal-close" onClick={handleClose} aria-label="Tutup">
              <X size={15} />
            </button>

            {/* Icon + Title */}
            <div className="welcome-header">
              <div className="welcome-icon-wrap">
                <Sparkles size={22} className="welcome-icon" />
              </div>
              <div>
                <h2 className="welcome-title">Hei, sebelum mulai! 👋</h2>
                <p className="welcome-subtitle">Ada satu hal penting yang perlu kamu tau</p>
              </div>
            </div>

            {/* Info box */}
            <div className="welcome-info-box">
              <div className="welcome-info-row">
                <div className="welcome-info-icon-wrap">
                  <Sparkles size={12} className="text-orange-400" />
                </div>
                <div>
                  <p className="welcome-info-label">Berbasis AI</p>
                  <p className="welcome-info-desc">
                    Roasting dilakukan oleh AI, bukan manusia beneran.
                  </p>
                </div>
              </div>
              <div className="welcome-divider" />
              <div className="welcome-info-row">
                <div className="welcome-info-icon-wrap warning">
                  <Info size={12} className="text-yellow-400" />
                </div>
                <div>
                  <p className="welcome-info-label">Ada Kuota Harian</p>
                  <p className="welcome-info-desc">
                    Kalau tiba-tiba gabisa, berarti limitnya udah habis hari ini.{" "}
                    <span className="welcome-bold">Coba lagi besok ya! 😴</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <label className="welcome-checkbox-label">
              <div className="welcome-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  className="welcome-checkbox-input"
                  id="dont-show-today"
                />
                <div className={`welcome-checkbox-box ${dontShowToday ? "checked" : ""}`}>
                  {dontShowToday && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span>Jangan tampilkan lagi hari ini</span>
            </label>

            {/* CTA */}
            <button
              className="welcome-cta-btn"
              onClick={handleClose}
              id="welcome-modal-ok"
            >
              Siap, gas roasting! 🔥
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
