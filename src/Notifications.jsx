import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function Notifications({ user, onBack, onNavigate, onRateSquad }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      setNotifications(data || []);
      setLoading(false);
      await supabase.from("notifications").update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .neq("type", "join_request")
        .neq("type", "rate_squad");
    };
    load();
  }, [user]);

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getIcon = (type) => {
    switch (type) {
      case "join_request": return "👥";
      case "request_accepted": return "🎉";
      case "rate_squad": return "⭐";
      case "received_rating": return "⭐";
      case "spot_opened": return "🔔";
      default: return "📬";
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <button className="btn card shadow-sm" onClick={onBack} style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>← Back</button>
      </div>
      <div style={{ padding: "20px 16px 0" }}>
        <h1 className="display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>Notifications</h1>
        <p style={{ color: "var(--text3)", fontSize: 14, marginTop: 4 }}>Stay up to date</p>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        {loading && (
          <div style={{ textAlign: "center", color: "var(--text3)", marginTop: 40 }}>Loading...</div>
        )}
        {!loading && notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <p style={{ fontWeight: 600, color: "var(--text2)" }}>No notifications yet</p>
            <p style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>When someone requests to join your event or you get rated you'll see it here</p>
          </div>
        )}
        {notifications.map(n => (
          <div key={n.id} className="card shadow-sm" onClick={async () => {
            if (n.type === "join_request") onNavigate("requests");
            if (n.type === "request_accepted") {
              await supabase.from("notifications").delete().eq("id", n.id);
              setNotifications(prev => prev.filter(notif => notif.id !== n.id));
              onNavigate("explore");
            }
            if (n.type === "rate_squad") onRateSquad(n.data?.event_id);
          }} style={{
            padding: "16px 18px", marginBottom: 10, cursor: "pointer",
            borderLeft: n.read ? "none" : "3px solid var(--accent)",
            background: n.read ? "var(--card)" : "rgba(255,87,51,0.06)",
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{getIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3, lineHeight: 1.4 }}>{n.body}</div>}
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>{formatTime(n.created_at)}</div>
              </div>
              {!n.read && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 6px var(--accent)", flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}