"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Check, Flame } from "lucide-react";

interface RoastCardProps {
  roast: string;
  username: string;
  onCopy: () => void;
}

export default function RoastCard({ roast, username, onCopy }: RoastCardProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [copied, setCopied] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    // eslint-disable-next-line
    setDisplayedText("");
    setIsTyping(true);

    const chunkSize = 3; // chars per tick for faster typing
    const interval = setInterval(() => {
      if (indexRef.current < roast.length) {
        const end = Math.min(indexRef.current + chunkSize, roast.length);
        setDisplayedText(roast.slice(0, end));
        indexRef.current = end;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [roast]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roast);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const tweetText = `Gue baru kena roast AI gara-gara Twitter gue 💀🔥\n\n"${roast.slice(0, 200)}..."\n\nRoast profil X lo di 👇`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent("https://roastx.vercel.app")}`;
    window.open(url, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="roast-card"
    >
      {/* Card header */}
      <div className="roast-header">
        <div className="roast-badge">
          <span className="animate-flame inline-flex align-bottom">
            <Flame size={14} />
          </span>
          <span>AI Roasting untuk @{username}</span>
        </div>
      </div>

      {/* Roast text */}
      <div className="roast-text">
        {displayedText.split('*').map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : <span key={i}>{part}</span>
        )}
        {isTyping && <span className="cursor">|</span>}
      </div>

      {/* Actions */}
      {!isTyping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="roast-actions"
        >
          <button
            onClick={handleCopy}
            className="btn-action"
            aria-label="Copy roasting"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Tercopy!" : "Copy"}</span>
          </button>
          <button
            onClick={handleShare}
            className="btn-action btn-share"
            aria-label="Share ke X"
          >
            <Share2 size={16} />
            <span>Share ke X</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
