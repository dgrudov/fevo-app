import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { sendNotification } from "./notificationHelper";

export default function Notifications({ user, myName, onBack, onNavigate, onRateSquad, onOpenChat, onOpenEvent, onBuddyUpdate }) {
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
      if (error) { console.error(error); setLoading(false); return; }
      setNotifications(data || []);
      setLoading(false);
      await supabase.from("notifications").update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
        .neq("type", "join_request")
        .neq("type", "rate_squad")
        .neq("type", "buddy_request")
        .neq("type", "new_message");
    };
    load();

    const channel = supabase
      .channel("notifications-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications(prev => [payload.new, ...prev])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const formatTime = (timestamp) => {
    const ts = timestamp.endsWith('Z') || timestamp.includes('+') ? timestamp : timestamp + 'Z';
    const diff = Date.now() - new Date(ts);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const ACTION_TYPES = ["join_request", "rate_squad", "buddy_request"];

  const getIcon = (type) => {
    switch (type) {
      case "join_request": return "👥";
      case "join_info": return "👥";
      case "request_accepted": return "🎉";
      case "buddy_request": return "👋";
      case "buddy_accepted": return "🎉";
      case "buddy_event": return "👥";
      case "rate_squad": return "⭐";
      case "received_rating": return "⭐";
      case "spot_opened": return "🔔";
      case "new_message": return "💬";
      case "new_event": return "🔥";
      default: return "📬";
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <button className="btn card shadow-sm" onClick={onBack} style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>← Back</button>
      </div>
      <div style={{ padding: "20px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>Notifications</h1>
          <p style={{ color: "var(--text3)", fontSize: 14, marginTop: 4 }}>Stay up to date</p>
        </div>
        {notifications.some(n => n.type !== "join_request" && n.type !== "rate_squad" && n.type !== "buddy_request") && (
          <button onClick={async () => {
            await supabase.from("notifications").delete().eq("user_id", user.id)
              .neq("type", "join_request").neq("type", "rate_squad").neq("type", "buddy_request");
            setNotifications(prev => prev.filter(n => n.type === "join_request" || n.type === "rate_squad" || n.type === "buddy_request"));
          }} style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "var(--text3)", cursor: "pointer", marginTop: 4 }}>
            Clear all
          </button>
        )}
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
        {notifications.map(n => {
          const isActionable = ACTION_TYPES.includes(n.type);
          return (<div key={n.id} className="card shadow-sm" onClick={async () => {
            if (n.type === "join_request") onNavigate("requests");
            if (n.type === "rate_squad") onRateSquad(n.data?.event_id);
            if (n.type === "request_accepted") {
              await supabase.from("notifications").delete().eq("id", n.id);
              setNotifications(prev => prev.filter(notif => notif.id !== n.id));
              if (n.data?.event_id) onOpenEvent(n.data.event_id); else onNavigate("explore");
            }
            if (n.type === "buddy_accepted") {
              await supabase.from("notifications").delete().eq("id", n.id);
              setNotifications(prev => prev.filter(notif => notif.id !== n.id));
            }
            if (n.type === "buddy_event") {
              await supabase.from("notifications").delete().eq("id", n.id);
              setNotifications(prev => prev.filter(notif => notif.id !== n.id));
              if (n.data?.event_id) onOpenEvent(n.data.event_id);
            }
            if (n.type === "new_message") {
              await supabase.from("notifications").delete().eq("id", n.id);
              setNotifications(prev => prev.filter(notif => notif.id !== n.id));
              onOpenChat(n.data?.event_id);
            }
            if (n.type === "join_info" || n.type === "new_event") {
              await supabase.from("notifications").delete().eq("id", n.id);
              setNotifications(prev => prev.filter(notif => notif.id !== n.id));
              if (n.data?.event_id) onOpenEvent(n.data.event_id);
            }
          }} style={{
            padding: "16px 18px", marginBottom: 10, cursor: "pointer",
            borderLeft: !n.read && isActionable ? "3px solid var(--accent)" : "none",
            background: !n.read && isActionable ? "rgba(255,87,51,0.06)" : "var(--card)",
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{getIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3, lineHeight: 1.4 }}>{n.body}</div>}
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>{formatTime(n.created_at)}</div>
                {n.type === "buddy_request" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                    <button onClick={async () => {
                      await supabase.from("buddy_requests").update({ status: "accepted" }).eq("requester_id", n.data?.requester_id).eq("addressee_id", user.id);
                      await sendNotification(n.data?.requester_id, "buddy_accepted", `${myName} accepted your buddy request 🎉`, `You two are now buddies`, { buddy_id: user.id });
                      await supabase.from("notifications").delete().eq("id", n.id);
                      setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                      if (onBuddyUpdate) onBuddyUpdate(n.data?.requester_id, true);
                    }} style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Accept</button>
                    <button onClick={async () => {
                      await supabase.from("buddy_requests").delete().eq("requester_id", n.data?.requester_id).eq("addressee_id", user.id);
                      await supabase.from("notifications").delete().eq("id", n.id);
                      setNotifications(prev => prev.filter(notif => notif.id !== n.id));
                    }} style={{ flex: 1, padding: "8px 0", borderRadius: 10, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Decline</button>
                  </div>
                )}
                {n.type === "buddy_event" && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Tap to view event →</div>
                )}
              </div>
              {!n.read && isActionable && n.type !== "buddy_request" && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 6px var(--accent)", flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}
