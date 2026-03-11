import { useState } from "react";
import { supabase } from "./supabase";

export default function RatingModal({ event, user, onClose }) {
  const membersToRate = event.members
    .map((id, i) => ({ id, name: event.memberNames?.[i] || "?" }))
    .filter(m => m.id !== user.id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratings, setRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const current = membersToRate[currentIndex];
  const isLast = currentIndex === membersToRate.length - 1;
  const progress = ((currentIndex) / membersToRate.length) * 100;

  const goNext = async (rating) => {
    if (animating) return;

    // Save rating if provided
    const newRatings = rating
      ? { ...ratings, [current.id]: rating }
      : ratings;
    setRatings(newRatings);

    if (isLast) {
      // Submit all
      setSubmitting(true);
      for (const member of membersToRate) {
        const r = newRatings[member.id];
        if (!r) continue;
        await supabase.from("ratings").insert({
          event_id: event.id, rater_id: user.id, rated_id: member.id, rating: r,
        });
        await supabase.rpc("update_user_rating", {
          target_user_id: member.id, new_rating: r,
        });
      }
      setSubmitting(false);
      onClose(true);
      return;
    }

    setAnimating(true);
    setDirection(1);
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
      setSelectedRating(newRatings[membersToRate[currentIndex + 1]?.id] || 0);
      setAnimating(false);
    }, 280);
  };

  const skipAll = () => onClose(false);

  const ratingLabels = ["", "Meh 😐", "Okay 🙂", "Good 😊", "Great 🔥", "Amazing 🌟"];

  const displayRating = hoveredRating || selectedRating;

  if (membersToRate.length === 0) {
    onClose(false);
    return null;
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 20px",
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: "#161009", borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden", position: "relative",
      }}>
        {/* Top highlight */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

        {/* Progress bar */}
        <div style={{ height: 3, background: "#221c14" }}>
          <div style={{
            height: "100%", background: "linear-gradient(90deg, #ff5733, #ff8c42)",
            width: `${((currentIndex + 1) / membersToRate.length) * 100}%`,
            transition: "width 0.4s ease",
            boxShadow: "0 0 8px rgba(255,87,51,0.6)",
          }} />
        </div>

        <div style={{ padding: "28px 28px 32px" }}>
          {/* Counter + skip */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: 1 }}>
              {currentIndex + 1} / {membersToRate.length}
            </div>
            <button onClick={skipAll} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 600, padding: "4px 8px" }}>
              Skip all
            </button>
          </div>

          {/* Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, fontWeight: 800, color: "#fff",
              boxShadow: "0 0 40px rgba(99,102,241,0.3)",
              marginBottom: 16,
              transition: "all 0.28s ease",
              opacity: animating ? 0 : 1,
              transform: animating ? `translateX(${direction * 40}px)` : "translateX(0)",
            }}>
              {current.name?.[0]?.toUpperCase()}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "'Clash Display', serif",
              letterSpacing: -0.5, marginBottom: 4,
              transition: "all 0.28s ease",
              opacity: animating ? 0 : 1,
              transform: animating ? `translateX(${direction * 40}px)` : "translateX(0)",
            }}>
              {current.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              {event.emoji} {event.title}
            </div>
          </div>

          {/* Stars */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 10, marginBottom: 12,
            transition: "all 0.28s ease",
            opacity: animating ? 0 : 1,
          }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{
                  fontSize: 38, background: "none", border: "none", cursor: "pointer",
                  filter: displayRating >= star ? "none" : "grayscale(1) opacity(0.25)",
                  transform: displayRating >= star ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.15s",
                  lineHeight: 1,
                }}>⭐</button>
            ))}
          </div>

          {/* Label */}
          <div style={{ textAlign: "center", height: 22, marginBottom: 28 }}>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: displayRating ? "#ff8c42" : "transparent",
              transition: "color 0.15s",
            }}>
              {ratingLabels[displayRating]}
            </span>
          </div>

          {/* Buttons */}
          <button
            onClick={() => selectedRating ? goNext(selectedRating) : null}
            disabled={!selectedRating || submitting}
            style={{
              width: "100%", padding: 15, borderRadius: 16, fontSize: 16, fontWeight: 700,
              background: selectedRating ? "linear-gradient(135deg, #ff5733, #ff8c42)" : "#221c14",
              color: selectedRating ? "#fff" : "rgba(255,255,255,0.2)",
              border: "none", cursor: selectedRating ? "pointer" : "not-allowed",
              boxShadow: selectedRating ? "0 8px 24px rgba(255,87,51,0.4)" : "none",
              transition: "all 0.2s", marginBottom: 10,
            }}>
            {submitting ? "Submitting..." : isLast ? "Submit ✨" : "Next →"}
          </button>

          <button
            onClick={() => goNext(null)}
            disabled={submitting}
            style={{
              width: "100%", padding: 12, borderRadius: 16, fontSize: 14, fontWeight: 600,
              background: "none", border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >
            {isLast ? "Skip & finish" : "Skip this person"}
          </button>
        </div>
      </div>
    </div>
  );
}