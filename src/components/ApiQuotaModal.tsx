"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ApiQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiQuotaModal({ isOpen, onClose }: ApiQuotaModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
            </div>
            <h2 className="modal-title font-bold text-center text-xl mb-2 text-white">
              API Limit Reached!
            </h2>
            <div className="modal-body text-center text-gray-400">
              <p className="mb-4">
                Waduh, jatah ngeroast gratisnya udah habis nih buat sekarang gara-gara kepenuhan (rate limit).
              </p>
              <p>
                Sabar ya bro, coba lagi nanti. AI juga butuh istirahat! 😴🔥
              </p>
            </div>
            <div className="mt-6">
              <button 
                className="w-full py-3 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                onClick={onClose}
              >
                Yaudah deh, ngerti
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
