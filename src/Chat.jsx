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
        .from("messages")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: true });
      if (error) { console.error(error); return; }
      setMessages(data || []);
      setLoading(false);
    };
    loadMessages();

    const subscription = supabase
      .channel(`chat-${event.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `event_id=eq.${event.id}`,
      }, (payload) => {
        setMessages(prev => {
          const exists = prev.some(m => 
            m.id === payload.new.id || 
            (m.content === payload.new.content && m.user_id === payload.new.user_id && Math.abs(new Date(m.created_at) - new Date(payload.new.created_at)) < 2000)
          );
          if (exists) return prev.map(m => 
            (m.content === payload.new.content && m.user_id === payload.new.user_id) 
              ? payload.new 
              : m
          );
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [event.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return;
    const handleFocus = () => {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    };
    textarea.addEventListener("focus", handleFocus);
    return () => textarea.removeEventListener("focus", handleFocus);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const tempId = Date.now();
    const message = {
      event_id: event.id,
      user_id: user.id,
      user_name: myName,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      id: tempId,
    };
    setNewMessage("");
    setMessages(prev => [...prev, message]);
    const { error } = await supabase.from("messages").insert({
      event_id: message.event_id,
      user_id: message.user_id,
      user_name: message.user_name,
      content: message.content,
      created_at: message.created_at,
    });
    if (error) console.error(error);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column",
      background: "#f8f5f0", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 16px", background: "#fff", borderBottom: "1px solid #e8e3db", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4 }}>←</button>
        <div style={{ width: 40, height: 40, borderRadius: 12, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", background: `${event.color}18` }}>{event.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>{event.title}</div>
          <div style={{ fontSize: 12, color: "#8a7a6a" }}>{event.groupSize} members</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && (
          <div style={{ textAlign: "center", color: "#8a7a6a", marginTop: 40 }}>Loading messages...</div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8a7a6a" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontWeight: 600 }}>No messages yet</p>
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
                <div style={{ fontSize: 12, color: "#8a7a6a", marginBottom: 4, marginLeft: 36 }}>{msg.user_name}</div>
              )}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isMe ? "row-reverse" : "row", width: "100%" }}>
                {!isMe && (
                  <div style={{ width: 28, height: isLastInGroup ? 28 : 0, borderRadius: "50%", background: isLastInGroup ? event.color + "55" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {isLastInGroup ? msg.user_name?.[0]?.toUpperCase() : ""}
                  </div>
                )}
                <div style={{
                  maxWidth: "72%",
                  padding: "10px 14px",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe ? "#1a1209" : "#fff",
                  color: isMe ? "#f8f5f0" : "#1a1209",
                  fontSize: 15,
                  lineHeight: 1.5,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  border: isMe ? "none" : "1px solid #e8e3db",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}>
                  {msg.content}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#a89f92", marginTop: 2, marginLeft: isMe ? 0 : 44, marginRight: isMe ? 4 : 0 }}>
                {formatTime(msg.created_at)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px 20px", background: "#fff", borderTop: "1px solid #e8e3db", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1, background: "#f8f5f0", border: "1.5px solid #e8e3db",
            borderRadius: 20, padding: "10px 16px", fontSize: 15,
            fontFamily: "'DM Sans', sans-serif", outline: "none",
            resize: "none", color: "#1a1209", lineHeight: 1.4,
          }}
        />
        <button onClick={sendMessage} disabled={!newMessage.trim()} style={{
          width: 44, height: 44, borderRadius: "50%", border: "none",
          cursor: newMessage.trim() ? "pointer" : "not-allowed",
          background: newMessage.trim() ? "#1a1209" : "#e8e3db",
          color: newMessage.trim() ? "#f8f5f0" : "#a89f92",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>↑</button>
      </div>
    </div>
  );
}