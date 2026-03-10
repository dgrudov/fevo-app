import { useState } from "react";
import { supabase } from "./supabase";

export default function RatingModal({ event, user, onClose }) {
  const [ratings, setRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const membersToRate = event.members
    .map((id, i) => ({ id, name: event.memberNames[i] }))
    .filter(m => m.id !== user.id);

const handleSubmit = async () => {
  setSubmitting(true);
  for (const member of membersToRate) {
    const rating = ratings[member.id];
    if (!rating) continue;
    
    await supabase.from("ratings").insert({
      event_id: event.id,
      rater_id: user.id,
      rated_id: member.id,
      rating: rating,
    });



   await supabase.rpc("update_user_rating", {
  target_user_id: member.id,
  new_rating: rating,
});
  }
  setSubmitting(false);
  onClose(true);
};
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px",
        width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Rate your squad</h2>
          <p style={{ fontSize: 14, color: "#9a6a5a", marginTop: 4 }}>{event.emoji} {event.title} · Ratings are anonymous</p>
        </div>

        {membersToRate.map(member => (
          <div key={member.id} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16, fontWeight: 700,
              }}>
                {member.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{member.name}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRatings({ ...ratings, [member.id]: star })} style={{
                  fontSize: 32, background: "none", border: "none", cursor: "pointer",
                  opacity: ratings[member.id] >= star ? 1 : 0.3,
                  transform: ratings[member.id] >= star ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.1s",
                }}>⭐</button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={handleSubmit} disabled={submitting || membersToRate.some(m => !ratings[m.id])} style={{
          width: "100%", padding: 16, borderRadius: 14, fontSize: 16, fontWeight: 700,
          background: membersToRate.some(m => !ratings[m.id]) ? "#fdddd5" : "#ff5733",
          color: membersToRate.some(m => !ratings[m.id]) ? "#c4957a" : "#fff5f0",
          border: "none", cursor: membersToRate.some(m => !ratings[m.id]) ? "not-allowed" : "pointer",
          marginBottom: 12,
        }}>
          {submitting ? "Submitting..." : "Submit Ratings"}
        </button>
        <button onClick={() => onClose(false)} style={{
          width: "100%", padding: 12, borderRadius: 14, fontSize: 14, fontWeight: 600,
          background: "none", border: "none", color: "#9a6a5a", cursor: "pointer",
        }}>Skip for now</button>
      </div>
    </div>
  );
}