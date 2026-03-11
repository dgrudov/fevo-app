import { useState, useRef, useEffect } from "react";

const slides = [
  {
    id: "welcome",
    emoji: "🌍",
    eyebrow: "WELCOME TO FEVO",
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
          position: "absolute",
          left: `${p.x}%`,
          top: `${p.y}%`,
          fontSize: p.size,
          opacity: p.opacity,
          animation: `float${i % 3} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          filter: "blur(0.5px)",
        }}>{p.emoji}</div>
      ))}
      {/* Glow orb */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 280,
        height: 280,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        filter: "blur(40px)",
        animation: "pulse 3s ease-in-out infinite",
      }} />
    </div>
  );
}

export default function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef(null);
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  const goTo = (next) => {
    if (animating || next < 0 || next >= slides.length) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 200);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) goTo(step + 1);
    if (diff < -50) goTo(step - 1);
    touchStartX.current = null;
  };

  const bgGradient = `radial-gradient(ellipse at 50% 30%, ${slide.bg[1]} 0%, ${slide.bg[2]} 50%, ${slide.bg[0]} 100%)`;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: "100vh",
        maxWidth: 480,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        background: bgGradient,
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.8s ease",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes float0 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } }
        @keyframes float1 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(-8deg); } }
        @keyframes float2 { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(5deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.6; transform: translateX(-50%) scale(1); } 50% { opacity: 1; transform: translateX(-50%) scale(1.15); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes stepIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .slide-content { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .emoji-pop { animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both; }
        .step-item-0 { animation: stepIn 0.4s ease 0.2s both; }
        .step-item-1 { animation: stepIn 0.4s ease 0.3s both; }
        .step-item-2 { animation: stepIn 0.4s ease 0.4s both; }
        .step-item-3 { animation: stepIn 0.4s ease 0.5s both; }
      `}</style>

      {/* Background particles */}
      {slide.particles && <FloatingParticles emojis={slide.particles} accent={slide.accent} />}

      {/* Noise texture overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 32px 0", position: "relative", zIndex: 2 }}>

        {/* Eyebrow */}
        <div className="slide-content" style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 3,
          color: slide.accent, marginBottom: 28, opacity: 0.9,
        }}>{slide.eyebrow}</div>

        {/* Emoji */}
        <div className="emoji-pop" style={{
          fontSize: 88, lineHeight: 1, marginBottom: 24,
          filter: `drop-shadow(0 0 30px ${slide.accent}66)`,
        }}>{slide.emoji}</div>

        {/* Title */}
        <h1 className="slide-content" style={{
          fontSize: 48, fontWeight: 900, color: "#fff",
          letterSpacing: -1.5, lineHeight: 1.05,
          marginBottom: 16, whiteSpace: "pre-line",
          fontFamily: "'Clash Display', 'Georgia', serif",
          textShadow: `0 0 60px ${slide.accent}44`,
          animationDelay: "0.05s",
        }}>{slide.title}</h1>

        {/* Subtitle */}
        <p className="slide-content" style={{
          fontSize: 16, color: "rgba(255,255,255,0.6)",
          lineHeight: 1.65, maxWidth: 300,
          animationDelay: "0.1s",
        }}>{slide.subtitle}</p>

        {/* Steps */}
        {slide.steps && (
          <div style={{ marginTop: 28, width: "100%" }}>
            {slide.steps.map((s, i) => (
              <div key={i} className={`step-item-${i}`} style={{
                display: "flex", alignItems: "center", gap: 14,
                marginBottom: 10,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                  background: `${slide.accent}18`,
                  border: `1px solid ${slide.accent}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: "#fff", fontWeight: 600 }}>{s.text}</div>
                </div>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: slide.accent, opacity: 0.5,
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM */}
      <div style={{ padding: "32px 32px 48px", position: "relative", zIndex: 2 }}>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {slides.map((s, i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              height: 6, borderRadius: 100,
              width: i === step ? 28 : 6,
              background: i === step ? slide.accent : "rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              cursor: "pointer",
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          {step > 0 && (
            <button onClick={() => goTo(step - 1)} style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}>←</button>
          )}
          <button
            onClick={() => isLast ? onFinish() : goTo(step + 1)}
            style={{
              flex: 1, height: 56, borderRadius: 16,
              fontSize: 16, fontWeight: 700,
              background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)`,
              color: "#fff", border: "none", cursor: "pointer",
              boxShadow: `0 8px 32px ${slide.accent}44`,
              letterSpacing: 0.3,
              transition: "all 0.3s ease",
            }}
          >
            {isLast ? "Find My Squad 🔥" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}