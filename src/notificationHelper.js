import { supabase } from "./supabase";

// In native Capacitor app, window.Capacitor exists and we need the full URL
const API_BASE = window.Capacitor ? "https://gruvio.app" : "";
const IS_PROD = import.meta.env.PROD || !!window.Capacitor;

export const sendNotification = async (userId, type, title, body, data = {}) => {
  // In-app notification
  const { error } = await supabase.from("notifications").insert({
    user_id: userId, type, title, body, data,
  });
  if (error) console.error("Notification error:", error);

  // Push notification (skip in local dev)
  if (IS_PROD) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      fetch(`${API_BASE}/api/send-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title, body, token: session.access_token }),
      }).catch(() => {});
    }
  }
};
