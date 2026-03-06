import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async () => {
    if (!email || !password || !name) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError(null);
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) { setError(signupError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: name,
        username: name.toLowerCase().replace(/\s+/g, ""),
        bio: "Ready for anything 🌍",
        location: "Sofia, BG",
      });
      onLogin(data.user, name);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError(null);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError(loginError.message); setLoading(false); return; }
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      onLogin(data.user, profile?.full_name || "");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f5f0",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "0 24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .display { font-family: 'Clash Display', Georgia, serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { background: #faf9f7; border: 1.5px solid #e8e3db; color: #1a1209; border-radius: 12px; padding: 14px 16px; font-size: 15px; width: 100%; outline: none; font-family: 'DM Sans', sans-serif; transition: border 0.2s; }
        input:focus { border-color: #1a1209; background: #fff; }
        input::placeholder { color: #a89f92; }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🌍</div>
        <h1 className="display" style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Fevo</h1>
        <p style={{ color: "#8a7a6a", fontSize: 15, marginTop: 6 }}>Find your people. Go do things.</p>
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.06)" }}>
        
        {/* Tabs */}
        <div style={{ display: "flex", background: "#f8f5f0", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); }} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
              background: mode === m ? "#1a1209" : "transparent",
              color: mode === m ? "#f8f5f0" : "#8a7a6a",
              fontSize: 14, fontWeight: 700, transition: "all 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}>{m === "login" ? "Log In" : "Sign Up"}</button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
              {error}
            </div>
          )}

          <button onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading} style={{
            padding: 15, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#e8e3db" : "#1a1209",
            color: loading ? "#a89f92" : "#f8f5f0",
            fontSize: 16, fontWeight: 700, marginTop: 4,
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
          }}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </div>
      </div>

      <p style={{ color: "#a89f92", fontSize: 12, marginTop: 24, textAlign: "center" }}>
        By continuing you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}