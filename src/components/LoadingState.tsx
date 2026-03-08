"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FUN_TEXTS = [
  "Lagi ngulik profil lo yang absurd ini... 🔍",
  "AI lagi nyiapin roasting paling savage... 🔥",
  "Memindai setiap jejak digital lo... 👀",
  "Ngitung rasio follower/following yang memalukan... 😂",
  "AI lagi diasah lidahnya... ⚡",
  "Kompilasi semua hal kocak dari profil lo... 💀",
  "Hampir selesai, sabar ya bro... ✨",
];

export default function LoadingState() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % FUN_TEXTS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="loading-container"
    >
      {/* Flame spinner */}
      <div className="flame-spinner">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="spinner-ring"
        />
        <span className="flame-emoji">🔥</span>
      </div>

      {/* Rotating fun text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={textIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="loading-text"
        >
          {FUN_TEXTS[textIndex]}
        </motion.p>
      </AnimatePresence>

      <p className="loading-sub">Bisa makan 10–20 detik, tenang aja 😅</p>
    </motion.div>
  );
}
