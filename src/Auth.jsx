import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setLoading(true); setError(null);
    const redirectTo = window.Capacitor ? "https://gruvio.app" : window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (resetError) { setError(resetError.message); return; }
    setResetSent(true);
  };

  const handleSignup = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    if (!ageConfirmed) { setError("You must be at least 16 years old to use Gruvio"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(null);
    await supabase.auth.signOut();
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) {
      const msg = signupError.message?.toLowerCase() || "";
      if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("user already exists")) {
        setError("An account with this email already exists. Please log in instead.");
        setMode("login");
      } else {
        setError(signupError.message);
      }
      setLoading(false); return;
    }
    if (data.user) {
      const apiBase = window.Capacitor ? "https://gruvio.app" : "";
      const emailRes = await fetch(`${apiBase}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId: data.user.id }),
      }).catch(() => null);
      if (!emailRes || !emailRes.ok) {
        await supabase.from("profiles").insert({
          id: data.user.id, email: data.user.email,
          onboarded: false,
        }).catch(() => {});
      }
      setConfirmationEmail(email);
      setConfirmationSent(true);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true); setError(null);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password, options: { persistSession: rememberMe } });
    if (loginError) {
      if (loginError.message?.toLowerCase().includes("email not confirmed")) {
        setConfirmationEmail(email);
        setConfirmationSent(true);
        setLoading(false);
        return;
      }
      setError(loginError.message); setLoading(false); return;
    }
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      if (profile?.banned === true) {
        onLogin(data.user, profile?.full_name || "", false, true);
        setLoading(false);
        return;
      }
      // Backfill email for users who signed up before email was stored in profiles
      if (!profile?.email && data.user.email) {
        supabase.from("profiles").update({ email: data.user.email }).eq("id", data.user.id);
      }
      onLogin(data.user, profile?.full_name || "", !profile?.onboarded);
    }
    setLoading(false);
  };

  if (confirmationSent) return (
    <div style={{
      minHeight: "100vh", background: "#0a0805",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "0 24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 500, height: 400, background: "radial-gradient(ellipse, rgba(255,87,51,0.08), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Clash Display', Georgia, serif", fontSize: 52, fontWeight: 700, letterSpacing: -2, color: "#fff", filter: "drop-shadow(0 0 30px rgba(255,87,51,0.4))", marginBottom: 10 }}>Gruvio</h1>
      </div>
      <div style={{ width: "100%", maxWidth: 400, background: "#161009", borderRadius: 24, padding: 32, border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📧</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Check your email</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 6 }}>
          We sent a confirmation link to
        </p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#ff8c42", marginBottom: 24, wordBreak: "break-all" }}>{confirmationEmail}</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 28 }}>
          Click the link in the email to activate your account. Check your spam folder if you don't see it.
        </p>
        <button
          onClick={async () => {
            setLoading(true);
            const apiBase = window.Capacitor ? "https://gruvio.app" : "";
            await fetch(`${apiBase}/api/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: confirmationEmail }),
            }).catch(() => {});
            setLoading(false);
          }}
          disabled={loading}
          style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid rgba(255,87,51,0.25)", cursor: loading ? "not-allowed" : "pointer", background: loading ? "#221c14" : "rgba(255,87,51,0.15)", color: loading ? "rgba(255,255,255,0.3)" : "#ff5733", fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}
        >
          {loading ? "Sending..." : "Resend confirmation email"}
        </button>
        <button
          onClick={() => { setConfirmationSent(false); setMode("login"); }}
          style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
        >
          Back to login
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0805",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "0 24px", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .display { font-family: 'Clash Display', Georgia, serif; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-input { background: #1a1510; border: 1.5px solid rgba(255,120,60,0.12); color: #fff; border-radius: 12px; padding: 14px 16px; font-size: 15px; width: 100%; outline: none; font-family: 'DM Sans', sans-serif; transition: border 0.2s; }
        .auth-input:focus { border-color: #ff5733; background: #221c14; }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* Background glows */}
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 500, height: 400, background: "radial-gradient(ellipse, rgba(255,87,51,0.08), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: "30%", width: 300, height: 300, background: "radial-gradient(ellipse, rgba(255,140,66,0.05), transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40, position: "relative" }}>
        <h1 className="display" style={{ fontSize: 52, fontWeight: 700, letterSpacing: -2, color: "#fff", filter: "drop-shadow(0 0 30px rgba(255,87,51,0.4))", marginBottom: 10 }}>Gruvio</h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 15, marginTop: 8 }}>Find your people. Go do things.</p>
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 400, background: "#161009", borderRadius: 24, padding: 28, border: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        {/* Card highlight line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />

        {/* Tabs */}
        <div style={{ display: "flex", background: "#1a1510", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); }} style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer",
              background: mode === m ? "linear-gradient(135deg, #ff5733, #ff8c42)" : "transparent",
              color: mode === m ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 14, fontWeight: 700, transition: "all 0.2s",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: mode === m ? "0 4px 16px rgba(255,87,51,0.35)" : "none",
            }}>{m === "login" ? "Log In" : "Sign Up"}</button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="auth-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" />
          <input className="auth-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />

          {mode === "login" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: -4 }}>
              <div onClick={() => setRememberMe(v => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${rememberMe ? "#ff5733" : "rgba(255,255,255,0.2)"}`, background: rememberMe ? "#ff5733" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  {rememberMe && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Remember me</span>
              </div>
              <span onClick={handleForgotPassword} style={{ fontSize: 13, color: "rgba(255,87,51,0.7)", cursor: "pointer", fontWeight: 500 }}>
                Forgot password?
              </span>
            </div>
          )}

          {resetSent && (
            <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#4ade80" }}>
              Check your email — we sent a password reset link.
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
              {error}
            </div>
          )}

          {mode === "signup" && (
            <div onClick={() => setAgeConfirmed(v => !v)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "4px 0" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${ageConfirmed ? "#ff5733" : "rgba(255,255,255,0.2)"}`, background: ageConfirmed ? "#ff5733" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                {ageConfirmed && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>I confirm I am at least 16 years old</span>
            </div>
          )}

          <button onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading} style={{
            padding: 15, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "#221c14" : "linear-gradient(135deg, #ff5733, #ff8c42)",
            color: loading ? "rgba(255,255,255,0.35)" : "#fff",
            fontSize: 16, fontWeight: 700, marginTop: 4,
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            boxShadow: loading ? "none" : "0 8px 24px rgba(255,87,51,0.35)",
          }}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </div>
      </div>

      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 24, textAlign: "center", lineHeight: 1.6 }}>
        By continuing you agree to our{" "}
        <span onClick={() => window.open("https://gruvio.app/terms", window.Capacitor ? "_system" : "_blank")} style={{ color: "rgba(255,87,51,0.7)", textDecoration: "underline", cursor: "pointer" }}>Terms of Service</span>
        {" "}and{" "}
        <span onClick={() => window.open("https://gruvio.app/privacy", window.Capacitor ? "_system" : "_blank")} style={{ color: "rgba(255,87,51,0.7)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>
      </p>
    </div>
  );
}