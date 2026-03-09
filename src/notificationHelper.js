import { supabase } from "./supabase";

export const sendNotification = async (userId, type, title, body, data = {}) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    data,
  });
  if (error) console.error("Notification error:", error);
};