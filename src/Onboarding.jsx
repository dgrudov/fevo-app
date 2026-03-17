import { useState, useRef } from "react";

const INTEREST_CATEGORIES = [
  { label: "Nightlife", emoji: "🪩", color: "#FF3CAC" },
  { label: "Sports", emoji: "🏃", color: "#10b981" },
  { label: "Outdoors", emoji: "🌿", color: "#65a30d" },
  { label: "Beach", emoji: "🏖️", color: "#0ea5e9" },
  { label: "Food & Drink", emoji: "🍽️", color: "#fb923c" },
  { label: "Culture", emoji: "🎨", color: "#818cf8" },
  { label: "Wellness", emoji: "🧘", color: "#2dd4bf" },
  { label: "Travel", emoji: "🚗", color: "#34d399" },
];

const slides = [
  {
    id: "welcome",
    emoji: "🌍",
    eyebrow: "WELCOME TO GRUVIO",
    title: "Tonight\nstarts here.",
    subtitle: "Your group too small? Find others doing the same thing and merge into something bigger.",
    bg: ["#0a0a0a", "#1a0800", "#2d0f00"],
    accent: "#ff5733",
    particles: ["🪩", "🎉", "🔥", "⚡", "✨", "🌙"],
  },
  {
    id: "howto",
    emoji: "🤝",
    eyebrow: "HOW IT WORKS",
    title: "Simple.\nPowerful.",
    subtitle: "Four steps between you and an unforgettable night.",
    bg: ["#0a0500", "#1f0a00", "#2d1200"],
    accent: "#ff8c42",
    steps: [
      { icon: "📣", text: "Post what you're planning" },
      { icon: "👥", text: "Others request to join" },
      { icon: "✅", text: "You approve the squad" },
      { icon: "🎉", text: "Go out together" },
    ],
  },
  {
    id: "profile",
    eyebrow: "YOUR PROFILE",
    title: "Tell us\nabout you.",
    subtitle: "This helps us show you the right events and people.",
    bg: ["#0a0500", "#200900", "#301200"],
    accent: "#ff5733",
  },
  {
    id: "interests",
    eyebrow: "PERSONALISE",
    title: "What are\nyou into?",
    subtitle: "Pick your interests and we'll show you the most relevant events first.",
    bg: ["#0a0500", "#200900", "#301200"],
    accent: "#ff5733",
  },
  {
    id: "ready",
    emoji: "🚀",
    eyebrow: "YOU'RE READY",
    title: "Your squad\nawaits.",
    subtitle: "Hundreds of people planning something right now. Don't be the one who stayed home.",
    bg: ["#080500", "#170900", "#251200"],
    accent: "#ffb347",
    particles: ["🏖️", "🏃", "🎨", "🍻", "⛺", "🎭"],
  },
];

function FloatingParticles({ emojis, accent }) {
  const particles = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      emoji: emojis[i % emojis.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 20,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.25,
    }))
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.current.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          fontSize: p.size, opacity: p.opacity,
          animation: `float${i % 3} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          filter: "blur(0.5px)",
        }}>{p.emoji}</div>
      ))}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 280, height: 280, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        filter: "blur(40px)", animation: "pulse 3s ease-in-out infinite",
      }} />
    </div>
  );
}

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const touchStartX = useRef(null);
  const slide = slides[step];
  const isLast = step === slides.length - 1;
  const isInterests = slide.id === "interests";
  const isProfile = slide.id === "profile";

  const profileValid = name.trim().length >= 2 && birthday && gender;
  const canProceed = isInterests ? selectedInterests.length > 0 : isProfile ? profileValid : true;

  const goTo = (next) => {
    if (animating || next < 0 || next >= slides.length) return;
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 200);
  };

  const toggleInterest = (label) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && canProceed) goTo(step + 1);
    if (diff < -50) goTo(step - 1);
    touchStartX.current = null;
  };

  const bgGradient = `radial-gradient(ellipse at 50% 30%, ${slide.bg[1]} 0%, ${slide.bg[2]} 50%, ${slide.bg[0]} 100%)`;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: "100vh", maxWidth: 480, margin: "0 auto",
        display: "flex", flexDirection: "column",
        background: bgGradient, fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.8s ease", userSelect: "none",
        position: "relative", overflow: "hidden",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { overflow-x: hidden; width: 100%; max-width: 100%; }
        @keyframes float0 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } }
        @keyframes float1 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(-8deg); } }
        @keyframes float2 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.15); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes stepIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        .slide-content { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .emoji-pop { animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both; }
        .step-item-0 { animation: stepIn 0.4s ease 0.2s both; }
        .step-item-1 { animation: stepIn 0.4s ease 0.3s both; }
        .step-item-2 { animation: stepIn 0.4s ease 0.4s both; }
        .step-item-3 { animation: stepIn 0.4s ease 0.5s both; }
        .interest-card { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .interest-card:active { transform: scale(0.95); }
        .onboard-input {
          width: 100%; padding: 14px 16px; border-radius: 14px;
          background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.12);
          color: #fff; font-size: 15px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .onboard-input:focus { border-color: #ff5733; }
        .onboard-input::placeholder { color: rgba(255,255,255,0.3); }
        .gender-btn { transition: all 0.2s ease; }
        .gender-btn:active { transform: scale(0.96); }
      `}</style>

      {slide.particles && <FloatingParticles emojis={slide.particles} accent={slide.accent} />}

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: (isInterests || isProfile) ? "40px 28px 0" : "40px 32px 0", position: "relative", zIndex: 2 }}>

        <div className="slide-content" style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 3,
          color: slide.accent, marginBottom: 28, opacity: 0.9,
        }}>{slide.eyebrow}</div>

        {slide.emoji && (
          <div className="emoji-pop" style={{
            fontSize: 88, lineHeight: 1, marginBottom: 24,
            filter: `drop-shadow(0 0 30px ${slide.accent}66)`,
          }}>{slide.emoji}</div>
        )}

        <h1 className="slide-content" style={{
          fontSize: (isInterests || isProfile) ? 40 : 48, fontWeight: 900, color: "#fff",
          letterSpacing: -1.5, lineHeight: 1.05,
          marginBottom: 12, whiteSpace: "pre-line",
          fontFamily: "'Clash Display', 'Georgia', serif",
          textShadow: `0 0 60px ${slide.accent}44`,
          animationDelay: "0.05s",
        }}>{slide.title}</h1>

        <p className="slide-content" style={{
          fontSize: 15, color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6, maxWidth: 300, marginBottom: (isInterests || isProfile) ? 24 : 0,
          animationDelay: "0.1s",
        }}>{slide.subtitle}</p>

        {/* Steps */}
        {slide.steps && (
          <div style={{ marginTop: 28, width: "100%" }}>
            {slide.steps.map((s, i) => (
              <div key={i} className={`step-item-${i}`} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                  background: `${slide.accent}18`, border: `1px solid ${slide.accent}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{s.icon}</div>
                <div style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>{s.text}</div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: slide.accent, opacity: 0.5, marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        )}

        {/* Profile step */}
        {isProfile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 8 }}>YOUR NAME</label>
              <input
                className="onboard-input"
                placeholder="What do people call you?"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={30}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 8 }}>DATE OF BIRTH</label>
              <input
                className="onboard-input"
                type="date"
                value={birthday}
                onChange={e => setBirthday(e.target.value)}
                max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 8 }}>GENDER</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["Male", "Female", "Other"].map(g => (
                  <button
                    key={g}
                    className="gender-btn"
                    onClick={() => setGender(g)}
                    style={{
                      flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 700,
                      border: `1.5px solid ${gender === g ? "#ff5733" : "rgba(255,255,255,0.12)"}`,
                      background: gender === g ? "rgba(255,87,51,0.15)" : "rgba(255,255,255,0.05)",
                      color: gender === g ? "#ff5733" : "rgba(255,255,255,0.6)",
                      cursor: "pointer",
                    }}
                  >{g}</button>
                ))}
              </div>
            </div>
            {!profileValid && (
              <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                Fill in all fields to continue
              </p>
            )}
          </div>
        )}

        {/* Interests grid */}
        {isInterests && (
          <div>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 10, width: "100%",
            }}>
              {INTEREST_CATEGORIES.map((cat, i) => {
                const selected = selectedInterests.includes(cat.label);
                return (
                  <button
                    key={cat.label}
                    className="interest-card"
                    onClick={() => toggleInterest(cat.label)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "14px 16px", borderRadius: 16, cursor: "pointer",
                      border: selected ? "1.5px solid #ff5733" : "1.5px solid rgba(255,255,255,0.08)",
                      background: selected ? "rgba(255,87,51,0.15)" : "rgba(255,255,255,0.04)",
                      boxShadow: selected ? "0 0 20px rgba(255,87,51,0.2)" : "none",
                      transform: selected ? "scale(1.02)" : "scale(1)",
                      animation: `popIn 0.35s ease ${i * 0.05 + 0.1}s both`,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: selected ? "#ff5733" : "rgba(255,255,255,0.7)",
                      transition: "color 0.2s",
                    }}>{cat.label}</span>
                    {selected && (
                      <div style={{
                        marginLeft: "auto", width: 18, height: 18, borderRadius: "50%",
                        background: "#ff5733", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 900,
                        flexShrink: 0,
                      }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedInterests.length === 0 && (
              <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 14 }}>
                Pick at least one to continue
              </p>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM */}
      <div style={{ padding: "24px 32px 48px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          {slides.map((s, i) => (
            <div key={i} onClick={() => { if (i < step || canProceed) goTo(i); }} style={{
              height: 6, borderRadius: 100,
              width: i === step ? 28 : 6,
              background: i === step ? slide.accent : "rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              cursor: "pointer",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {step > 0 && (
            <button onClick={() => goTo(step - 1)} style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}>←</button>
          )}
          <button
            onClick={() => {
              if (!canProceed) return;
              if (isLast) onFinish({ interests: selectedInterests, name: name.trim(), birthday, gender });
              else goTo(step + 1);
            }}
            style={{
              flex: 1, height: 56, borderRadius: 16,
              fontSize: 16, fontWeight: 700,
              background: canProceed
                ? `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)`
                : "rgba(255,255,255,0.08)",
              color: canProceed ? "#fff" : "rgba(255,255,255,0.3)",
              border: "none", cursor: canProceed ? "pointer" : "not-allowed",
              boxShadow: canProceed ? `0 8px 32px ${slide.accent}44` : "none",
              letterSpacing: 0.3, transition: "all 0.3s ease",
            }}
          >
            {isLast ? "Find My Squad" : isInterests && selectedInterests.length > 0 ? `Continue with ${selectedInterests.length} interest${selectedInterests.length > 1 ? "s" : ""} →` : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
