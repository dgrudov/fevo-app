import { supabase } from "./supabase";

export const sendNotification = async (userId, type, title, body, data = {}) => {
  // In-app notification
  const { error } = await supabase.from("notifications").insert({
    user_id: userId, type, title, body, data,
  });
  if (error) console.error("Notification error:", error);

  // Push notification (fire and forget)
  fetch("/api/send-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title, body }),
  }).catch(() => {});
};
