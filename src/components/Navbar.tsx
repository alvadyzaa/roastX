import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Info, ShieldAlert, Heart, Wrench, ExternalLink } from "lucide-react";

interface NavbarProps {
  onShowApiQuotaError?: () => void;
}

export default function Navbar({ onShowApiQuotaError }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"about" | "disclaimer" | "support" | "tools" | null>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <nav className="navbar">
        <a href="/" className="nav-logo">
          <span className="nav-logo-icon">🔥</span>
          RoastX
        </a>

        {/* Desktop Menu */}
        <div className="nav-links desktop-only">
          <button className="nav-link" onClick={() => setActiveModal("about")}>
            <Info size={15} />
            <span>About</span>
          </button>
          <button className="nav-link text-amber-500 hover:text-amber-400" onClick={() => setActiveModal("disclaimer")}>
            <ShieldAlert size={15} />
            <span>Disclaimer</span>
          </button>
          <a href="https://x.com/miegrains" target="_blank" rel="noopener noreferrer" className="nav-link">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current mr-1" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>Keith</span>
          </a>
          <button className="nav-link text-red-500 hover:text-red-400" onClick={() => setActiveModal("support")}>
            <Heart size={15} />
            <span>Support</span>
          </button>
          <button className="nav-link" onClick={() => setActiveModal("tools")}>
            <Wrench size={15} />
            <span>Tools</span>
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mobile-menu"
          >
            <div className="mobile-menu-content">
              <button
                className="mobile-menu-item"
                onClick={() => {
                  setActiveModal("about");
                  setIsOpen(false);
                }}
              >
                <Info size={18} />
                <span>About</span>
              </button>
              <button
                className="mobile-menu-item text-amber-500"
                onClick={() => {
                  setActiveModal("disclaimer");
                  setIsOpen(false);
                }}
              >
                <ShieldAlert size={18} />
                <span>Disclaimer</span>
              </button>
              <a
                href="https://x.com/miegrains" target="_blank" rel="noopener noreferrer"
                className="mobile-menu-item"
                onClick={() => setIsOpen(false)}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>Keith</span>
              </a>
              <button
                className="mobile-menu-item text-red-500"
                onClick={() => {
                  setActiveModal("support");
                  setIsOpen(false);
                }}
              >
                <Heart size={18} />
                <span>Support</span>
              </button>
              <button
                className="mobile-menu-item"
                onClick={() => {
                  setActiveModal("tools");
                  setIsOpen(false);
                }}
              >
                <Wrench size={18} />
                <span>Tools</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="modal-backdrop" onClick={() => setActiveModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                width: "100%",
                maxWidth: "24rem",
                backgroundColor: "#161618",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "28px",
                padding: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                position: "relative",
                margin: "1rem"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  padding: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  border: "none"
                }} 
                onClick={() => setActiveModal(null)}
              >
                <X size={18} color="#9ca3af" />
              </button>
              
              {activeModal === "about" && (
                <>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Info size={22} color="#ff5722" />
                    About RoastX
                  </h2>
                  <div style={{ color: "#d1d5db", fontSize: "0.875rem", lineHeight: "1.625", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p>
                      RoastX adalah aplikasi seru-seruan yang menggunakan AI untuk mereview dan nge-roast profil Twitter/X kamu dengan bahasa gaul yang pedas dan lucu.
                    </p>
                    <p>
                      Dibuat murni untuk hiburan. Jangan dimasukin ke hati ya! 😂
                    </p>
                  </div>
                </>
              )}

              {activeModal === "disclaimer" && (
                <>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <ShieldAlert size={22} color="#f59e0b" />
                    Disclaimer
                  </h2>
                  <div style={{ color: "#d1d5db", fontSize: "0.875rem", lineHeight: "1.625", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p>
                      Semua hasil roasting dihasilkan oleh AI (Artificial Intelligence) dan tidak mencerminkan pendapat pribadi pembuat website.
                    </p>
                    <p>
                      Kami tidak menyimpan data profil kamu. Sistem hanya mengambil informasi publik dari Twitter/X untuk bahan roasting. Harap gunakan dengan bijak dan jangan gunakan untuk bullying.
                    </p>
                  </div>
                </>
              )}

              {activeModal === "support" && (
                <>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <Heart size={22} color="#ef4444" />
                    Traktir Kopi ☕
                  </h2>
                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <p style={{ color: "#d1d5db", fontSize: "0.875rem", marginBottom: "16px" }}>
                      Suka pakai RoastX? Traktir saya kopi biar tetap semangat! 🙏
                    </p>
                    <div style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.1)", width: "100%", display: "flex", justifyContent: "center" }}>
                        <img 
                        src="https://i.postimg.cc/MGrDPbcc/Whats-App-Image-2026-02-04-at-15-37-29.jpg" 
                        alt="Scan QR untuk donasi" 
                        style={{ width: "100%", maxWidth: "200px", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                        width={200}
                        height={200}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModal === "tools" && (
                <>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                    <Wrench size={22} color="#ff5722" />
                    Other Tools
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <a
                      href="https://shadowbanchecker.pages.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", backgroundColor: "rgba(245, 158, 11, 0.1)", borderRadius: "9999px", border: "1px solid rgba(245, 158, 11, 0.2)", textDecoration: "none" }}
                    >
                      <div style={{ width: "40px", height: "40px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", margin: 0 }}>Shadowban Checker</h3>
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "2px 0 0 0" }}>Check your X account shadowban status</p>
                      </div>
                      <ExternalLink size={16} color="#6b7280" />
                    </a>
                    <a
                      href="https://worthx.pages.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "9999px", border: "1px solid rgba(16, 185, 129, 0.2)", textDecoration: "none" }}
                    >
                      <div style={{ width: "40px", height: "40px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", margin: 0 }}>WorthX</h3>
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "2px 0 0 0" }}>X Account Valuation & Price Check</p>
                      </div>
                      <ExternalLink size={16} color="#6b7280" />
                    </a>

                    <a
                      href="https://aestheticgen.pages.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", backgroundColor: "rgba(168, 85, 247, 0.1)", borderRadius: "9999px", border: "1px solid rgba(168, 85, 247, 0.2)", textDecoration: "none" }}
                    >
                      <div style={{ width: "40px", height: "40px", backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#a855f7", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", margin: 0 }}>AestheticGen</h3>
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "2px 0 0 0" }}>Generate aesthetic usernames</p>
                      </div>
                      <ExternalLink size={16} color="#6b7280" />
                    </a>

                    <a
                      href="https://x-hunter.pages.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px 20px", backgroundColor: "rgba(59, 130, 246, 0.1)", borderRadius: "9999px", border: "1px solid rgba(59, 130, 246, 0.2)", textDecoration: "none" }}
                    >
                      <div style={{ width: "40px", height: "40px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: "bold", color: "white", fontSize: "0.875rem", margin: 0 }}>X-Hunter</h3>
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "2px 0 0 0" }}>Brainstorming ideas & content strategy</p>
                      </div>
                      <ExternalLink size={16} color="#6b7280" />
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
