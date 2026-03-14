import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

export default function Chat({ event, user, myName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages").select("*").eq("event_id", event.id)
        .order("created_at", { ascending: true });
      if (error) { console.error(error); return; }
      setMessages(data || []);
      setLoading(false);
    };
    loadMessages();

    const subscription = supabase
      .channel(`chat-${event.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `event_id=eq.${event.id}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      }).subscribe();

    return () => supabase.removeChannel(subscription);
  }, [event.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = document.querySelector(".chat-input");
    if (!textarea) return;
    const handleFocus = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    textarea.addEventListener("focus", handleFocus);
    return () => textarea.removeEventListener("focus", handleFocus);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage("");
    const { error } = await supabase.from("messages").insert({
      event_id: event.id, user_id: user.id, user_name: myName, content,
    });
    if (error) { console.error(error); return; }

    const otherMembers = (event.members || []).filter(id => id !== user.id);
    for (const memberId of otherMembers) {
      // Push BEFORE RPC — so server check sees the previous unread notification, not this one
      if (location.hostname !== "localhost") {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.access_token) return;
          const apiBase = window.Capacitor ? "https://gruvio.app" : "";
          fetch(`${apiBase}/api/send-push`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: memberId, title: `${event.emoji} ${event.title}`, body: `${myName}: ${content}`, eventId: event.id, token: session.access_token }),
          }).catch(() => {});
        });
      }
      await supabase.rpc("notify_chat_member", {
        p_member_id: memberId,
        p_event_id: event.id,
        p_event_title: event.title,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (timestamp) => {
    const ts = timestamp.endsWith('Z') || timestamp.includes('+') ? timestamp : timestamp + 'Z';
    return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column",
      background: "#0a0805", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 16px 14px", background: "#161009",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4, color: "rgba(255,255,255,0.6)" }}>←</button>
        <div style={{ width: 40, height: 40, borderRadius: 12, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", background: `${event.color}18`, border: `1px solid ${event.color}25` }}>{event.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: "#fff" }}>{event.title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{event.groupSize} members</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 40 }}>Loading messages...</div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>No messages yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Be the first to say something!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.user_id === user.id;
          const showName = !isMe && (i === 0 || messages[i - 1].user_id !== msg.user_id);
          const isLastInGroup = i === messages.length - 1 || messages[i + 1]?.user_id !== msg.user_id;
          return (
            <div key={msg.id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              {showName && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 4, marginLeft: 36 }}>{msg.user_name}</div>
              )}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isMe ? "row-reverse" : "row", width: "100%" }}>
                {!isMe && (
                  <div style={{ width: 28, height: isLastInGroup ? 28 : 0, borderRadius: "50%", background: isLastInGroup ? event.color + "55" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {isLastInGroup ? msg.user_name?.[0]?.toUpperCase() : ""}
                  </div>
                )}
                <div style={{
                  maxWidth: "72%", padding: "10px 14px",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe ? "linear-gradient(135deg, #ff5733, #ff8c42)" : "#1a1510",
                  color: isMe ? "#fff" : "rgba(255,255,255,0.85)",
                  fontSize: 15, lineHeight: 1.5,
                  boxShadow: isMe ? "0 4px 16px rgba(255,87,51,0.3)" : "0 2px 8px rgba(0,0,0,0.3)",
                  border: isMe ? "none" : "1px solid rgba(255,255,255,0.06)",
                  wordBreak: "break-word", whiteSpace: "pre-wrap", overflowWrap: "anywhere",
                }}>
                  {msg.content}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2, marginLeft: isMe ? 0 : 44, marginRight: isMe ? 4 : 0 }}>
                {formatTime(msg.created_at)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px 28px", background: "#161009",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0,
      }}>
        <textarea
          className="chat-input"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1, background: "#1a1510", border: "1.5px solid rgba(255,120,60,0.15)",
            borderRadius: 20, padding: "10px 16px", fontSize: 15,
            fontFamily: "'DM Sans', sans-serif", outline: "none",
            resize: "none", color: "#fff", lineHeight: 1.4, transition: "border 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "#ff5733"}
          onBlur={e => e.target.style.borderColor = "rgba(255,120,60,0.15)"}
        />
        <button onClick={sendMessage} disabled={!newMessage.trim()} style={{
          width: 44, height: 44, borderRadius: "50%", border: "none",
          cursor: newMessage.trim() ? "pointer" : "not-allowed",
          background: newMessage.trim() ? "linear-gradient(135deg, #ff5733, #ff8c42)" : "#221c14",
          color: newMessage.trim() ? "#fff" : "rgba(255,255,255,0.2)",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: newMessage.trim() ? "0 4px 16px rgba(255,87,51,0.4)" : "none",
          transition: "all 0.2s",
        }}>↑</button>
      </div>
    </div>
  );
}