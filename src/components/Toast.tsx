"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onDismiss: () => void;
}

export default function Toast({ message, type = "success", onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
        exit={{ opacity: 0, y: 20, x: "-50%", scale: 0.95 }}
        transition={{ duration: 0.25 }}
        style={{
          position: "fixed",
          bottom: "32px",
          left: "50%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "9999px",
          border: `1px solid ${type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(74, 222, 128, 0.3)"}`,
          backgroundColor: type === "error" ? "#2a1313" : "#112411",
          color: type === "error" ? "#ef4444" : "#4ade80",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          zIndex: 50,
          fontSize: "14px",
          fontWeight: 500
        }}
      >
        {type === "success" ? <Check size={16} /> : <X size={16} />}
        <span>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
