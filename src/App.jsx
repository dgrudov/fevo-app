import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LocationInput from "./LocationInput";
import Chat from "./Chat";
import RatingModal from "./RatingModal";
import { sendNotification } from "./notificationHelper";
import Notifications from "./Notifications";
import Onboarding from "./Onboarding";

const ACTIVITY_CATEGORIES = [
  { label: "All", emoji: "🌍" },
  { label: "Nightlife", emoji: "🪩" },
  { label: "Outdoors", emoji: "🌿" },
  { label: "Sports", emoji: "⚽" },
  { label: "Beach", emoji: "🏖️" },
  { label: "Food & Drink", emoji: "🍜" },
  { label: "Culture", emoji: "🎨" },
  { label: "Wellness", emoji: "🧘" },
  { label: "Travel", emoji: "✈️" },
];

const ACTIVITY_TYPES = [
  { label: "Disco / Club", emoji: "🪩", category: "Nightlife", color: "#FF3CAC" },
  { label: "Bar Crawl", emoji: "🍻", category: "Nightlife", color: "#F7971E" },
  { label: "Rooftop Bar", emoji: "🍹", category: "Nightlife", color: "#e96c2f" },
  { label: "Karaoke", emoji: "🎤", category: "Nightlife", color: "#a78bfa" },
  { label: "Live Music", emoji: "🎸", category: "Nightlife", color: "#f43f5e" },
  { label: "Morning Run", emoji: "🏃", category: "Sports", color: "#10b981" },
  { label: "Cycling", emoji: "🚴", category: "Sports", color: "#06b6d4" },
  { label: "Football", emoji: "⚽", category: "Sports", color: "#22c55e" },
  { label: "Basketball", emoji: "🏀", category: "Sports", color: "#f97316" },
  { label: "Tennis", emoji: "🎾", category: "Sports", color: "#84cc16" },
  { label: "Surf", emoji: "🏄", category: "Beach", color: "#0ea5e9" },
  { label: "Beach Volleyball", emoji: "🏐", category: "Beach", color: "#f59e0b" },
  { label: "Beach Day", emoji: "🏖️", category: "Beach", color: "#fbbf24" },
  { label: "Swimming", emoji: "🏊", category: "Beach", color: "#38bdf8" },
  { label: "Hiking", emoji: "🥾", category: "Outdoors", color: "#78716c" },
  { label: "Camping", emoji: "⛺", category: "Outdoors", color: "#65a30d" },
  { label: "Picnic", emoji: "🧺", category: "Outdoors", color: "#a3e635" },
  { label: "Rock Climbing", emoji: "🧗", category: "Outdoors", color: "#d97706" },
  { label: "Brunch", emoji: "🥞", category: "Food & Drink", color: "#fb923c" },
  { label: "Dinner", emoji: "🍽️", category: "Food & Drink", color: "#e879f9" },
  { label: "Food Tour", emoji: "🍜", category: "Food & Drink", color: "#f87171" },
  { label: "Wine Tasting", emoji: "🍷", category: "Food & Drink", color: "#c084fc" },
  { label: "Coffee Meetup", emoji: "☕", category: "Food & Drink", color: "#92400e" },
  { label: "Museum", emoji: "🏛️", category: "Culture", color: "#818cf8" },
  { label: "Art Gallery", emoji: "🎨", category: "Culture", color: "#f472b6" },
  { label: "Theatre", emoji: "🎭", category: "Culture", color: "#a78bfa" },
  { label: "Cinema", emoji: "🎬", category: "Culture", color: "#6366f1" },
  { label: "Yoga", emoji: "🧘", category: "Wellness", color: "#2dd4bf" },
  { label: "Meditation", emoji: "🪷", category: "Wellness", color: "#c084fc" },
  { label: "Spa Day", emoji: "🛁", category: "Wellness", color: "#f9a8d4" },
  { label: "Road Trip", emoji: "🚗", category: "Travel", color: "#34d399" },
  { label: "Day Trip", emoji: "🗺️", category: "Travel", color: "#60a5fa" },
  { label: "Weekend Away", emoji: "🧳", category: "Travel", color: "#a78bfa" },
];

export default function App() {
  const [screen, setScreen] = useState("explore");
  const [events, setEvents] = useState([]);
  const [filterCat, setFilterCat] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [myName, setMyName] = useState("");
  const [myGroupSize, setMyGroupSize] = useState(1);
  const [joined, setJoined] = useState(null);
  const [createStep, setCreateStep] = useState(1);
  const [createForm, setCreateForm] = useState({ title: "", type: "", time: "", timeDate: null, location: "", vibe: "", maxSize: 8, category: "" });
  const [activityFilter, setActivityFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [now, setNow] = useState(new Date());
  const [showRating, setShowRating] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationSentRef = useRef(false);
  const touchStartX = useRef(0);
  const [notifications, setNotifications] = useState([]);
  const [avatarCache, setAvatarCache] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [photoLightbox, setPhotoLightbox] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadEventPhotos = async (eventId) => {
    const { data } = await supabase.from("event_photos").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
    setEventPhotos(data || []);
  };

  const navigateTo = (newScreen, opts = {}) => {
    window.history.pushState({ screen: newScreen }, "", window.location.href);
    setScreen(newScreen);
    if (opts.event !== undefined) {
      setSelectedEvent(opts.event);
      setEventPhotos([]);
      if (opts.event?.id) loadEventPhotos(opts.event.id);
      if (opts.event?.members?.length > 0) {
        supabase.from("profiles").select("id, avatar_url").in("id", opts.event.members)
          .then(({ data }) => {
            if (data) {
              const cache = {};
              data.forEach(p => { if (p.avatar_url) cache[p.id] = p.avatar_url; });
              setAvatarCache(prev => ({ ...prev, ...cache }));
            }
          });
      }
    }
    if (opts.user !== undefined) setViewingUser(opts.user);
    if (opts.step !== undefined) setCreateStep(opts.step);
  };

  useEffect(() => {
    window.history.pushState({ screen: "explore" }, "", window.location.href);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarCache(prev => ({ ...prev, [data.id]: data.avatar_url }));
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setUnreadCount(count || 0);
    };
    loadUnread();
  }, [user, screen]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = () => {
      const current = screen;
      if (current === "event") { setScreen("explore"); setSelectedEvent(null); }
      else if (current === "create") { setScreen("explore"); setCreateStep(1); }
      else if (current === "profile") { setScreen("explore"); }
      else if (current === "profileView") { setScreen("event"); }
      else if (current === "chat") { setScreen("event"); }
      else if (current === "requests") { setScreen("explore"); }
      else if (current === "notifications") { setScreen("explore"); }
      else { window.history.pushState(null, "", window.location.href); }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [screen]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        supabase.from("profiles").select("full_name, onboarded").eq("id", session.user.id).maybeSingle()
          .then(({ data }) => {
            if (data) {
              setMyName(data.full_name || "");
              if (!data.onboarded) setShowOnboarding(true);
            }
          });
      }
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        supabase.from("profiles").select("full_name, onboarded").eq("id", session.user.id).maybeSingle()
          .then(({ data }) => {
            if (data) {
              setMyName(data.full_name || "");
              if (!data.onboarded) setShowOnboarding(true);
            }
          });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadEvents = async () => {
      notificationSentRef.current = false;
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) { console.error(error); return; }
      const formatted = data.map(e => ({
        ...e, groupSize: e.group_size, maxSize: e.max_size, host: e.host_name, hostId: e.host_id,
        hostAvatar: e.host_name ? e.host_name[0].toUpperCase() : "?",
        hostGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        members: e.members || [], memberNames: e.member_names || [],
      }));
      const activeEvents = formatted.filter(e => {
        if (!e.time || e.time === "TBD") return true;
        const parsed = new Date(e.time);
        if (isNaN(parsed.getTime())) return true;
        return parsed > new Date();
      });
      setEvents(activeEvents);
      const hostIds = [...new Set((data || []).map(e => e.host_id).filter(Boolean))];
      if (hostIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, avatar_url").in("id", hostIds);
        if (profiles) {
          const cache = {};
          profiles.forEach(p => { if (p.avatar_url) cache[p.id] = p.avatar_url; });
          setAvatarCache(prev => ({ ...prev, ...cache }));
        }
      }
    };
    loadEvents();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const checkRatingNotifications = async () => {
      const { data: allEvents } = await supabase.from("events").select("*");
      if (!allEvents) return;
      const now = new Date();
      const passedEvents = allEvents
        .map(e => ({ ...e, members: e.members || [], memberNames: e.member_names || [] }))
        .filter(e => e.time && e.time !== "TBD" && new Date(e.time) < now && e.members.includes(user.id) && e.members.length > 1);
      for (const event of passedEvents) {
        const { data: existing } = await supabase.from("ratings").select("id").eq("event_id", event.id).eq("rater_id", user.id);
        if (existing && existing.length === 0) {
          const { data: existingNotif } = await supabase.from("notifications").select("id").eq("user_id", user.id).eq("type", "rate_squad").eq("data->>event_id", String(event.id));
          if (!existingNotif || existingNotif.length === 0) {
            await sendNotification(user.id, "rate_squad", "Rate your squad ⭐", `How was ${event.emoji} ${event.title}? Rate the people you met`, { event_id: event.id });
          }
        }
      }
    };
    checkRatingNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const loadRequests = async () => {
      const { data, error } = await supabase.from("join_requests").select("*").eq("status", "pending");
      if (error) { console.error(error); return; }
      setJoinRequests(data || []);
      setMyRequests(data.filter(r => r.user_id === user.id).map(r => r.event_id));
      const requesterIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
      if (requesterIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, avatar_url").in("id", requesterIds);
        if (profiles) {
          const cache = {};
          profiles.forEach(p => { if (p.avatar_url) cache[p.id] = p.avatar_url; });
          setAvatarCache(prev => ({ ...prev, ...cache }));
        }
      }
    };
    loadRequests();
  }, [user]);

  const filteredEvents = events.filter(e => filterCat === "All" || e.category === filterCat);
  const spotsLeft = e => e.maxSize - e.groupSize;

  const handleJoin = async (event) => {
    if (!user) return;
    if (event.hostId === user.id) {
      const updatedMembers = [...event.members, user.id];
      const updatedNames = [...(event.memberNames || []), myName];
      const updatedSize = event.groupSize + 1;
      await supabase.from("events").update({ members: updatedMembers, member_names: updatedNames, group_size: updatedSize }).eq("id", event.id);
      setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
      setSelectedEvent({ ...event, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames });
      setToast("Welcome back to your event! 👑");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (event.members.includes(user.id)) { setToast("You're already in this squad 👀"); setTimeout(() => setToast(null), 3000); return; }
    if (event.groupSize >= event.maxSize) { setToast("This event is full 😔"); setTimeout(() => setToast(null), 3000); return; }
    const { data: existing } = await supabase.from("join_requests").select("*").eq("event_id", event.id).eq("user_id", user.id).single();
    if (existing) {
      await supabase.from("join_requests").delete().eq("event_id", event.id).eq("user_id", user.id);
      setMyRequests(myRequests.filter(id => id !== event.id));
    }
    const { error } = await supabase.from("join_requests").insert({ event_id: event.id, user_id: user.id, user_name: myName, status: "pending" });
    if (error) { console.error(error); return; }
    await sendNotification(event.hostId, "join_request", "New join request 👥", `${myName} wants to join ${event.emoji} ${event.title}`, { event_id: event.id, user_id: user.id, user_name: myName });
    setMyRequests([...myRequests, event.id]);
    setToast("Request sent! Waiting for approval 🙌");
    setTimeout(() => setToast(null), 3000);
  };

  const handleLeave = async (event) => {
    if (!user) return;
    const updatedMembers = event.members.filter(m => m !== user.id);
    const updatedNames = (event.memberNames || []).filter(m => m !== myName);
    const updatedSize = event.groupSize - 1;
    const { error } = await supabase.from("events").update({ members: updatedMembers, member_names: updatedNames, group_size: updatedSize }).eq("id", event.id);
    if (error) { console.error(error); return; }
    await supabase.from("join_requests").delete().eq("event_id", event.id).eq("user_id", user.id);
    setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
    setJoined(null); setScreen("explore"); setSelectedEvent(null);
    setMyRequests(myRequests.filter(id => id !== event.id));
    setToast(`You left "${event.title}"`);
    setTimeout(() => setToast(null), 3000);
  };

  const formattedTime = createForm.time ? new Date(createForm.time).toISOString() : "TBD";
  const handleCreate = async () => {
    if (!createForm.title || !myName || !createForm.type || !createForm.time || !createForm.location) return;
    const typeData = ACTIVITY_TYPES.find(t => t.label === createForm.type) || ACTIVITY_TYPES[0];
    const newEvent = {
      title: createForm.title, type: createForm.type, emoji: typeData.emoji,
      category: typeData.category, color: typeData.color, host_id: user.id, host_name: myName,
      time: formattedTime, location: createForm.location || "TBD", vibe: createForm.vibe || "",
      group_size: 1, max_size: parseInt(createForm.maxSize) || 8,
      members: [user.id], member_names: [myName],
    };
    const { data, error } = await supabase.from("events").insert(newEvent).select().single();
    if (error) { console.error(error); return; }
    const formatted = {
      ...data, groupSize: data.group_size, maxSize: data.max_size,
      host: data.host_name, hostId: data.host_id, hostAvatar: myName[0].toUpperCase(),
      hostGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      members: data.members || [], memberNames: data.member_names || [],
    };
    setEvents([formatted, ...events]);
    setCreateForm({ title: "", type: "", time: "", timeDate: null, location: "", vibe: "", maxSize: 8, category: "" });
    setCreateStep(1); setScreen("explore");
    setToast("Event created! 🎉");
    setTimeout(() => setToast(null), 3000);
  };

  const selectedType = ACTIVITY_TYPES.find(t => t.label === createForm.type);

  if (!authReady) return (
    <div style={{ minHeight: "100vh", background: "#0a0805", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 40, filter: "drop-shadow(0 0 20px rgba(255,87,51,0.5))" }}>🌍</div>
    </div>
  );

  if (!user) return <Auth onLogin={(u, name) => { setUser(u); setMyName(name); }} />;

  if (showOnboarding) return (
    <Onboarding onFinish={async () => {
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
      setShowOnboarding(false);
    }} />
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', sans-serif", color: "var(--text)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0805; --bg2: #110e09; --bg3: #1a1510; --bg4: #221c14;
          --border: rgba(255,120,60,0.12); --border2: rgba(255,255,255,0.06);
          --accent: #ff5733; --accent2: #ff8c42;
          --text: #ffffff; --text2: rgba(255,255,255,0.6); --text3: rgba(255,255,255,0.35);
          --card: #161009; --glow: rgba(255,87,51,0.15);
        }
        .display { font-family: 'Clash Display', 'Georgia', serif; }
        .btn { cursor: pointer; border: none; outline: none; transition: all 0.18s cubic-bezier(.4,0,.2,1); }
        .btn:hover { transform: translateY(-2px); }
        .btn:active { transform: translateY(0) scale(0.98); }
        .card { background: var(--card); border-radius: 20px; border: 1px solid var(--border2); position: relative; overflow: hidden; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); pointer-events: none; }
        .shadow { box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
        .shadow-sm { box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        input, select, textarea { background: var(--bg3); border: 1.5px solid var(--border); color: var(--text); border-radius: 12px; padding: 12px 16px; font-size: 15px; width: 100%; outline: none; font-family: 'DM Sans', sans-serif; transition: border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: var(--accent); background: var(--bg4); }
        input::placeholder, textarea::placeholder { color: var(--text3); }
        select option { background: var(--bg3); color: var(--text); }
        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .chip { display: inline-flex; align-items: center; gap: 5px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 100px; padding: 5px 12px; font-size: 13px; color: var(--text2); font-weight: 500; }
        .avatar-ring { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .tab-btn { cursor: pointer; padding: 7px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; transition: all 0.18s; border: none; }
        .progress { height: 3px; border-radius: 100px; background: var(--bg4); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s ease; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: rgba(10,8,5,0.92); backdrop-filter: blur(20px); border-top: 1px solid var(--border2); padding: 12px 24px 20px; display: flex; justify-content: space-around; z-index: 200; }
        .stagger-1 { animation: fadeIn 0.35s ease 0.05s both; }
        .stagger-2 { animation: fadeIn 0.35s ease 0.1s both; }
        .stagger-3 { animation: fadeIn 0.35s ease 0.15s both; }
        .stagger-4 { animation: fadeIn 0.35s ease 0.2s both; }
        .glow-line { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,87,51,0.3), transparent); margin: 0 20px; }
        .activity-type-btn { cursor: pointer; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; transition: all 0.18s; }
        ::-webkit-scrollbar { width: 0; }
        .react-datepicker { background: var(--bg3) !important; border: 1px solid var(--border) !important; }
        .react-datepicker__header { background: var(--bg4) !important; border-bottom: 1px solid var(--border) !important; }
        .react-datepicker__current-month, .react-datepicker__day-name { color: var(--text) !important; }
        .react-datepicker__day { color: var(--text2) !important; }
        .react-datepicker__day:hover { background: var(--bg4) !important; color: #fff !important; }
        .react-datepicker__day--selected { background: var(--accent) !important; color: #fff !important; }
        .react-datepicker__day--disabled { color: var(--text3) !important; }
        .react-datepicker__time-container { border-left: 1px solid var(--border) !important; }
        .react-datepicker__time { background: var(--bg3) !important; }
        .react-datepicker__time-list-item { color: var(--text2) !important; }
        .react-datepicker__time-list-item:hover { background: var(--bg4) !important; }
        .react-datepicker__time-list-item--selected { background: var(--accent) !important; color: #fff !important; }
        .react-datepicker__navigation-icon::before { border-color: var(--text2) !important; }
      `}</style>

      {/* ── EXPLORE ── */}
      {screen === "explore" && (
        <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 300, height: 200, background: "radial-gradient(ellipse, rgba(255,87,51,0.08), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            <div>
              <h1 className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, color: "#fff" }}>Explore</h1>
              <p style={{ color: "var(--text3)", fontSize: 14, marginTop: 2 }}>{filteredEvents.length} events near you</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {joined && joined.members?.includes(user?.id) && (
                <div style={{ background: "#10b981", borderRadius: 100, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>✓ Joined</div>
              )}
              <button className="btn" onClick={() => navigateTo("notifications")} style={{ width: 36, height: 36, borderRadius: 12, background: "var(--bg3)", border: "1px solid var(--border2)", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                <div>🔔</div>
                {unreadCount > 0 && <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 6px var(--accent)", border: "1.5px solid var(--bg)" }} />}
              </button>
              <div className="avatar-ring btn" onClick={() => navigateTo("profile")} style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: avatarCache[user?.id] ? "transparent" : "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 0 16px rgba(255,87,51,0.35)" }}>
                {avatarCache[user?.id] ? <img src={avatarCache[user?.id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : myName?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="glow-line" style={{ marginTop: 14, marginBottom: 0 }} />

          <div style={{ overflowX: "auto", padding: "12px 20px", display: "flex", gap: 8 }}>
            {ACTIVITY_CATEGORIES.map(cat => (
              <button key={cat.label} className="tab-btn" onClick={() => setFilterCat(cat.label)} style={{ flexShrink: 0, background: filterCat === cat.label ? "var(--accent)" : "var(--bg3)", color: filterCat === cat.label ? "#fff" : "var(--text2)", border: filterCat === cat.label ? "none" : "1px solid var(--border2)", boxShadow: filterCat === cat.label ? "0 4px 16px rgba(255,87,51,0.35)" : "none" }}>{cat.emoji} {cat.label}</button>
            ))}
          </div>

          <div style={{ padding: "0 16px" }}>
            {filteredEvents.map((event, i) => (
              <div key={event.id} className={`card shadow stagger-${Math.min(i + 1, 4)}`} onClick={() => navigateTo("event", { event })} style={{ padding: 18, marginBottom: 12, cursor: "pointer" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: event.color, filter: "blur(30px)", opacity: 0.15, pointerEvents: "none" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", background: `${event.color}18`, border: `1px solid ${event.color}25`, flexShrink: 0 }}>{event.emoji}</div>
                    <div>
                      <div className="display" style={{ fontWeight: 600, fontSize: 16, letterSpacing: -0.3, lineHeight: 1.2, color: "#fff" }}>{event.title}</div>
                      <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3, display: "flex", gap: 5, alignItems: "center" }}>
                        <div className="avatar-ring" style={{ width: 16, height: 16, background: event.hostGradient, color: "#fff", fontSize: 7, overflow: "hidden" }}>
                          {avatarCache[event.hostId] ? <img src={avatarCache[event.hostId]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : event.hostAvatar}
                        </div>
                        {event.host}
                      </div>
                    </div>
                  </div>
                  <span style={{ background: `${event.color}18`, color: event.color, borderRadius: 100, padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0, border: `1px solid ${event.color}25` }}>{event.emoji} {event.type}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="chip">🕐 {event.time && event.time !== "TBD" ? new Date(event.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : event.time}</span>
                  <span className="chip">📍 {event.location}</span>
                  {event.vibe && <span className="chip">✨ {event.vibe}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                      {(event.memberNames || event.members || []).slice(0, 5).map((m, j) => (
                        <div key={j} className="avatar-ring" style={{ width: 24, height: 24, marginLeft: j > 0 ? -8 : 0, fontSize: 9, background: event.color + "55", border: "2px solid var(--card)", color: "#fff", zIndex: 5 - j, fontWeight: 700 }}>{m[0].toUpperCase()}</div>
                      ))}
                      {event.members.length > 5 && <div className="avatar-ring" style={{ width: 24, height: 24, marginLeft: -8, fontSize: 9, background: "var(--bg4)", border: "2px solid var(--card)", color: "var(--text3)", fontWeight: 700, zIndex: 0 }}>+{event.members.length - 5}</div>}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>{event.groupSize} joined</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: spotsLeft(event) <= 2 ? "#ef4444" : "#10b981" }}>{spotsLeft(event)} spots left</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{ width: `${(event.groupSize / event.maxSize) * 100}%`, background: event.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EVENT DETAIL ── */}
      {screen === "event" && selectedEvent && (
        <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
          <div style={{ padding: "20px 16px 0" }}>
            <button className="btn card shadow-sm" onClick={() => navigateTo("explore", { event: null })} style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>← Back</button>
          </div>
          <div style={{ margin: "14px 16px 0", borderRadius: 22, padding: 24, background: `${selectedEvent.color}08`, border: `1px solid ${selectedEvent.color}20`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: selectedEvent.color, filter: "blur(60px)", opacity: 0.12, pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${selectedEvent.color}40, transparent)` }} />
            <div style={{ fontSize: 52, marginBottom: 10, filter: `drop-shadow(0 0 20px ${selectedEvent.color}66)`, position: "relative" }}>{selectedEvent.emoji}</div>
            <h2 className="display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, color: "#fff", position: "relative" }}>{selectedEvent.title}</h2>
            <span style={{ background: `${selectedEvent.color}20`, color: selectedEvent.color, borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700 }}>{selectedEvent.type}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, position: "relative" }}>
              {[["🕐", selectedEvent.time && selectedEvent.time !== "TBD" ? new Date(selectedEvent.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : selectedEvent.time], ["📍", selectedEvent.location], ["✨", selectedEvent.vibe], ["👑", `Hosted by ${selectedEvent.host}`]].filter(x => x[1]).map(([icon, val], i) => (
                <div key={i} style={{ display: "flex", gap: 10, color: "var(--text2)", fontSize: 14 }}><span>{icon}</span><span>{val}</span></div>
              ))}
            </div>
          </div>

          {(() => {
            if (!selectedEvent.time) return null;
            const eventTime = new Date(selectedEvent.time);
            if (isNaN(eventTime.getTime())) return null;
            const diff = eventTime - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null;
            if (!selectedEvent.members.includes(user?.id) && selectedEvent.hostId !== user?.id) return null;
            return (
              <div style={{ margin: "12px 16px 0", padding: "14px 18px", borderRadius: 16, background: "linear-gradient(135deg, rgba(255,87,51,0.15), rgba(255,140,66,0.08))", border: "1px solid rgba(255,87,51,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 22 }}>⏱</div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Starting in</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`}</div>
                </div>
              </div>
            );
          })()}

          {(selectedEvent.members.includes(user?.id) || selectedEvent.hostId === user?.id) && (
            <button className="btn" onClick={() => navigateTo("chat", { event: selectedEvent })} style={{ margin: "12px 16px 0", width: "calc(100% - 32px)", padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--accent)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>💬 Squad Chat</button>
          )}

          <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => navigateTo("profileView", { user: { id: selectedEvent.hostId, name: selectedEvent.host } })}>
            <div className="avatar-ring" style={{ width: 46, height: 46, background: selectedEvent.hostGradient, color: "#fff", fontSize: 17, overflow: "hidden" }}>
              {avatarCache[selectedEvent.hostId] ? <img src={avatarCache[selectedEvent.hostId]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : selectedEvent.hostAvatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#fff" }}>{selectedEvent.host}</div>
              <div style={{ fontSize: 13, color: "var(--text3)" }}>View profile →</div>
            </div>
            {selectedEvent.hostId === user?.id && (
              <button className="btn" onClick={async (e) => {
                e.stopPropagation();
                const { error } = await supabase.from("events").delete().eq("id", selectedEvent.id);
                if (error) { console.error(error); return; }
                setEvents(events.filter(ev => ev.id !== selectedEvent.id));
                setScreen("explore"); setSelectedEvent(null);
                setToast("Event deleted"); setTimeout(() => setToast(null), 3000);
              }} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Delete</button>
            )}
          </div>

          <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 11, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Squad · {selectedEvent.groupSize}/{selectedEvent.maxSize}</span>
              <span style={{ fontSize: 12, color: spotsLeft(selectedEvent) <= 2 ? "#ef4444" : "#10b981", fontWeight: 700 }}>{spotsLeft(selectedEvent)} open</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {(selectedEvent.memberNames && selectedEvent.memberNames.length > 0 ? selectedEvent.memberNames : selectedEvent.members).map((m, i) => {
                const memberId = selectedEvent.members[i];
                const isCurrentUser = memberId === user?.id;
                return (
                  <div key={i} onClick={() => isCurrentUser ? navigateTo("profile") : navigateTo("profileView", { user: { id: memberId, name: m } })} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 100, padding: "4px 10px 4px 4px", cursor: "pointer" }}>
                    <div className="avatar-ring" style={{ width: 24, height: 24, background: selectedEvent.color + "55", color: "#fff", fontSize: 9, fontWeight: 800, overflow: "hidden" }}>
                      {avatarCache[memberId] ? <img src={avatarCache[memberId]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)" }}>{m}</span>
                  </div>
                );
              })}
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${(selectedEvent.groupSize / selectedEvent.maxSize) * 100}%`, background: `linear-gradient(90deg, ${selectedEvent.color}, ${selectedEvent.color}99)` }} /></div>
          </div>

          {(selectedEvent.members.includes(user?.id) || selectedEvent.hostId === user?.id) && (
            <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase" }}>📸 Squad Photos</span>
                <label style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--accent)", opacity: uploadingPhoto ? 0.5 : 1, pointerEvents: uploadingPhoto ? "none" : "auto" }}>
                  {uploadingPhoto ? "Uploading…" : "+ Add"}
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (!files.length) return;
                    setUploadingPhoto(true);
                    const newRows = [];
                    for (const file of files) {
                      const ext = file.name.split(".").pop();
                      const path = `${selectedEvent.id}/${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                      const { error: upErr } = await supabase.storage.from("event-photos").upload(path, file);
                      if (upErr) { console.error(upErr); continue; }
                      const { data: urlData } = supabase.storage.from("event-photos").getPublicUrl(path);
                      const { data: row, error: dbErr } = await supabase.from("event_photos").insert({ event_id: selectedEvent.id, user_id: user.id, user_name: myName, photo_url: urlData.publicUrl }).select().single();
                      if (dbErr) { console.error("DB insert error:", dbErr); continue; }
                      if (row) newRows.push(row);
                    }
                    if (newRows.length) setEventPhotos(prev => [...newRows.reverse(), ...prev]);
                    setUploadingPhoto(false);
                    e.target.value = "";
                  }} />
                </label>
              </div>
              {eventPhotos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  No photos yet — be the first to share!
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {eventPhotos.map((p, i) => (
                    <div key={p.id} onClick={() => setPhotoLightbox(i)} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "var(--bg3)" }}>
                      <img src={p.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 18 }}>
            <p style={{ fontWeight: 700, marginBottom: 14, fontSize: 11, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Join this squad</p>
            {selectedEvent.members.includes(user?.id) ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", textAlign: "center" }}>✓ You're in this squad</div>
                <button className="btn" onClick={() => handleLeave(selectedEvent)} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Leave Event</button>
              </div>
            ) : selectedEvent.hostId === user?.id && selectedEvent.members.includes(user?.id) ? (
              <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)", textAlign: "center" }}>👑 You're the host</div>
            ) : spotsLeft(selectedEvent) <= 0 ? (
              <div>
                <button disabled style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--text3)", border: "none", marginBottom: 10 }}>Event is Full 😔</button>
                <button className="btn" onClick={() => { setToast("We'll notify you if a spot opens up 🔔"); setTimeout(() => setToast(null), 3000); }} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--accent)", border: "1px solid var(--border)" }}>🔔 Notify Me When a Spot Opens</button>
              </div>
            ) : selectedEvent.hostId === user?.id ? (
              <button className="btn" onClick={() => handleJoin(selectedEvent)} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", boxShadow: "0 8px 24px rgba(255,87,51,0.35)" }}>👑 Rejoin Your Event</button>
            ) : myRequests.includes(selectedEvent.id) ? (
              <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", textAlign: "center" }}>⏳ Request Pending</div>
            ) : (
              <button className="btn" onClick={() => handleJoin(selectedEvent)} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", boxShadow: "0 8px 24px rgba(255,87,51,0.35)" }}>Request to Join 🙌</button>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE ── */}
      {screen === "create" && (
        <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
          <div style={{ padding: "24px 16px 0" }}>
            <div style={{ fontSize: 11, letterSpacing: 2.5, color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>CREATE EVENT</div>
            <h1 className="display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>What's the plan?</h1>
            <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 4, marginBottom: 16 }}>Step {createStep} of 3</p>
            <div style={{ display: "flex", gap: 5, marginBottom: 24 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 100, background: s <= createStep ? "var(--accent)" : "var(--bg4)", transition: "background 0.3s", boxShadow: s === createStep ? "0 0 8px rgba(255,87,51,0.5)" : "none" }} />
              ))}
            </div>
          </div>
          <div style={{ padding: "0 16px" }}>
            {createStep === 1 && (
              <div className="fade-in">
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
                  {ACTIVITY_CATEGORIES.slice(1).map(cat => (
                    <button key={cat.label} className="tab-btn" onClick={() => setActivityFilter(cat.label)} style={{ background: activityFilter === cat.label ? "var(--accent)" : "var(--bg3)", color: activityFilter === cat.label ? "#fff" : "var(--text2)", border: activityFilter === cat.label ? "none" : "1px solid var(--border2)", fontSize: 12, padding: "6px 12px", boxShadow: activityFilter === cat.label ? "0 4px 12px rgba(255,87,51,0.3)" : "none" }}>{cat.emoji} {cat.label}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {ACTIVITY_TYPES.filter(t => activityFilter === "All" || t.category === activityFilter).map(type => (
                    <div key={type.label} className="activity-type-btn" onClick={() => { setCreateForm({ ...createForm, type: type.label, category: type.category }); setCreateStep(2); }} style={{ background: createForm.type === type.label ? `${type.color}15` : "var(--card)", border: createForm.type === type.label ? `2px solid ${type.color}` : "1px solid var(--border2)", boxShadow: createForm.type === type.label ? `0 0 20px ${type.color}25` : "none" }}>
                      <span style={{ fontSize: 26 }}>{type.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3, color: createForm.type === type.label ? type.color : "var(--text2)" }}>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {createStep === 2 && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {selectedType && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", background: `${selectedType.color}10`, borderRadius: 14, border: `1px solid ${selectedType.color}20`, marginBottom: 4 }}>
                    <span style={{ fontSize: 28 }}>{selectedType.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{selectedType.label}</div>
                      <button className="btn" onClick={() => setCreateStep(1)} style={{ fontSize: 12, color: selectedType.color, background: "none", fontWeight: 600 }}>Change →</button>
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>YOUR NAME *</label>
                  <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="What's your name?" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>EVENT TITLE *</label>
                  <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="e.g. Morning Run – Sofia" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>WHEN</label>
                  <DatePicker selected={createForm.timeDate || null} onChange={date => setCreateForm({ ...createForm, time: date ? date.toISOString() : "", timeDate: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="EEE d MMM, HH:mm" minDate={new Date()} placeholderText="Pick a date and time" customInput={<input style={{ width: "100%", cursor: "pointer" }} readOnly />} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>LOCATION</label>
                  <LocationInput value={createForm.location} onChange={val => setCreateForm({ ...createForm, location: val })} placeholder="Search for a location" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>VIBE / DESCRIPTION</label>
                  <textarea value={createForm.vibe} onChange={e => setCreateForm({ ...createForm, vibe: e.target.value })} placeholder="Describe the plan..." rows={2} style={{ resize: "none" }} />
                </div>
                <button className="btn" onClick={() => { if (createForm.title && myName) setCreateStep(3); }} style={{ padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700, background: createForm.title && myName ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--bg4)", color: createForm.title && myName ? "#fff" : "var(--text3)", boxShadow: createForm.title && myName ? "0 8px 24px rgba(255,87,51,0.3)" : "none" }}>Continue →</button>
              </div>
            )}
            {createStep === 3 && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card" style={{ padding: 18, background: `${selectedType?.color || "var(--accent)"}10`, border: `1px solid ${selectedType?.color || "var(--accent)"}20` }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{selectedType?.emoji}</div>
                  <div className="display" style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: "#fff" }}>{createForm.title}</div>
                  <div style={{ color: "var(--text3)", fontSize: 13, display: "flex", gap: 10 }}>
                    <span>🕐 {createForm.time && createForm.time !== "TBD" ? new Date(createForm.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBD"}</span>
                    <span>📍 {createForm.location || "TBD"}</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>YOUR GROUP SIZE</label>
                  <select value={myGroupSize} onChange={e => setMyGroupSize(e.target.value)}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} person{n > 1 ? "s" : ""}</option>)}</select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>MAX GROUP SIZE</label>
                  <select value={createForm.maxSize} onChange={e => setCreateForm({ ...createForm, maxSize: e.target.value })}>{[4, 6, 8, 10, 12, 15, 20, 30].map(n => <option key={n} value={n}>Up to {n} people</option>)}</select>
                </div>
                {(!createForm.title || !createForm.time || !createForm.location) && (
                  <p style={{ textAlign: "center", fontSize: 13, color: "var(--text3)" }}>{!createForm.title ? "Add a title to continue" : !createForm.time ? "Pick a date and time to continue" : "Add a location to continue"}</p>
                )}
                <button className="btn" onClick={handleCreate} disabled={!createForm.title || !createForm.time || !createForm.location} style={{ padding: 16, borderRadius: 14, fontSize: 16, fontWeight: 700, background: (!createForm.title || !createForm.time || !createForm.location) ? "var(--bg4)" : "linear-gradient(135deg, var(--accent), var(--accent2))", color: (!createForm.title || !createForm.time || !createForm.location) ? "var(--text3)" : "#fff", boxShadow: (!createForm.title || !createForm.time || !createForm.location) ? "none" : "0 8px 24px rgba(255,87,51,0.35)", cursor: (!createForm.title || !createForm.time || !createForm.location) ? "not-allowed" : "pointer" }}>Publish Event ✨</button>
                <button className="btn" onClick={() => setCreateStep(2)} style={{ padding: 12, background: "none", fontSize: 14, color: "var(--text3)" }}>← Back</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {screen === "notifications" && (
        <Notifications user={user} onBack={() => navigateTo("explore")} onNavigate={(s) => navigateTo(s)}
          onRateSquad={async (eventId) => {
            const numId = parseInt(eventId);
            const { data: existing } = await supabase.from("ratings").select("id").eq("event_id", numId).eq("rater_id", user.id);
            if (existing && existing.length > 0) {
              await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "rate_squad").eq("data->>event_id", String(numId));
              setToast("You already rated this squad ✅"); setTimeout(() => setToast(null), 3000); return;
            }
            const { data } = await supabase.from("events").select("*").eq("id", numId).single();
            if (data) {
              const formatted = { ...data, groupSize: data.group_size, maxSize: data.max_size, host: data.host_name, hostId: data.host_id, members: data.members || [], memberNames: data.member_names || [] };
              setShowRating(formatted); navigateTo("explore");
            }
          }}
        />
      )}

      {/* ── JOIN REQUESTS ── */}
      {screen === "requests" && (
        <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
          <div style={{ padding: "20px 16px 0" }}>
            <button className="btn card shadow-sm" onClick={() => navigateTo("explore")} style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>← Back</button>
          </div>
          <div style={{ padding: "20px 16px 0" }}>
            <h1 className="display" style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>Join Requests</h1>
            <p style={{ color: "var(--text3)", fontSize: 14, marginTop: 4 }}>People who want to join your events</p>
          </div>
          <div style={{ padding: "16px 16px 0" }}>
            {joinRequests.filter(r => events.find(e => e.id === r.event_id && e.hostId === user?.id)).length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <p style={{ fontWeight: 600, color: "var(--text2)" }}>No pending requests</p>
              </div>
            ) : (
              joinRequests.filter(r => events.find(e => e.id === r.event_id && e.hostId === user?.id)).map(request => {
                const event = events.find(e => e.id === request.event_id);
                return (
                  <div key={request.id} className="card shadow-sm" style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                      <div className="avatar-ring" style={{ width: 44, height: 44, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 16, fontWeight: 700, overflow: "hidden" }}>
                        {avatarCache[request.user_id] ? <img src={avatarCache[request.user_id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : request.user_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{request.user_name}</div>
                        <div style={{ fontSize: 13, color: "var(--text3)" }}>wants to join {event?.emoji} {event?.title}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn" onClick={async () => {
                        const updatedMembers = [...(event.members || []), request.user_id];
                        const updatedNames = [...(event.memberNames || []), request.user_name];
                        const updatedSize = event.groupSize + 1;
                        await supabase.from("events").update({ members: updatedMembers, member_names: updatedNames, group_size: updatedSize }).eq("id", event.id);
                        await supabase.from("join_requests").update({ status: "accepted" }).eq("id", request.id);
                        setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
                        setJoinRequests(joinRequests.filter(r => r.id !== request.id));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        setToast(`${request.user_name} joined the squad! 🎉`);
                        await sendNotification(request.user_id, "request_accepted", "Request accepted! 🎉", `You're now in the squad for ${event.emoji} ${event.title}`, { event_id: event.id });
                        await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "join_request");
                        setTimeout(() => setToast(null), 3000);
                      }} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", border: "none" }}>✓ Accept</button>
                      <button className="btn" onClick={async () => {
                        await supabase.from("join_requests").update({ status: "declined" }).eq("id", request.id);
                        await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "join_request");
                        setJoinRequests(joinRequests.filter(r => r.id !== request.id));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        setToast("Request declined"); setTimeout(() => setToast(null), 3000);
                      }} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>✕ Decline</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {screen === "chat" && selectedEvent && (
        <Chat event={selectedEvent} user={user} myName={myName} onBack={() => navigateTo("event", { event: selectedEvent })} />
      )}

      {(screen === "profile" || screen === "profileView") && (
        <ProfileScreen user={screen === "profileView" && viewingUser ? viewingUser : { id: user?.id, name: myName }} isMe={screen === "profile"} onBack={() => navigateTo(screen === "profileView" ? "event" : "explore")} myName={myName} setMyName={setMyName} joined={joined} events={events} />
      )}

      {photoLightbox !== null && eventPhotos[photoLightbox] && (() => {
        const photo = eventPhotos[photoLightbox];
        const isFirst = photoLightbox === 0;
        const isLast = photoLightbox === eventPhotos.length - 1;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (diff > 50 && !isLast) setPhotoLightbox(photoLightbox + 1);
              else if (diff < -50 && !isFirst) setPhotoLightbox(photoLightbox - 1);
            }}
          >
            <button onClick={() => setPhotoLightbox(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <div style={{ position: "absolute", top: 26, left: "50%", transform: "translateX(-50%)", fontSize: 13, color: "var(--text3)", fontWeight: 600 }}>{photoLightbox + 1} / {eventPhotos.length}</div>
            <img src={photo.photo_url} alt="" style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", padding: "0 16px", borderRadius: 12 }} />
            <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
              <button onClick={() => setPhotoLightbox(photoLightbox - 1)} disabled={isFirst} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: isFirst ? "rgba(255,255,255,0.2)" : "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 24, cursor: isFirst ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 13, color: "var(--text3)" }}>by {photo.user_name}</div>
                <button onClick={async () => {
                  const resp = await fetch(photo.photo_url);
                  const blob = await resp.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `fevo-photo-${photoLightbox + 1}.jpg`; a.click();
                  URL.revokeObjectURL(url);
                }} style={{ background: "rgba(255,87,51,0.15)", border: "1px solid rgba(255,87,51,0.3)", color: "var(--accent)", borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Save</button>
              </div>
              <button onClick={() => setPhotoLightbox(photoLightbox + 1)} disabled={isLast} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: isLast ? "rgba(255,255,255,0.2)" : "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 24, cursor: isLast ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>
          </div>
        );
      })()}

      {showRating && (
        <RatingModal event={showRating} user={user} onClose={async (rated) => {
          if (rated) {
            await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "rate_squad").eq("data->>event_id", String(showRating.id));
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          setShowRating(null);
        }} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "var(--bg3)", color: "#fff", border: "1px solid var(--border)", padding: "14px 24px", borderRadius: 100, fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,87,51,0.15)", animation: "fadeIn 0.3s ease", whiteSpace: "nowrap" }}>{toast}</div>
      )}

      {(screen === "explore" || screen === "create" || screen === "profile") && (
        <div className="bottom-nav">
          {[{ id: "explore", emoji: "🔍", label: "Explore" }, { id: "create", emoji: "＋", label: "Create", big: true }, { id: "profile", emoji: "👤", label: "Profile" }].map(nav => (
            <button key={nav.id} className="btn" onClick={() => navigateTo(nav.id, { step: 1 })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: nav.big ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "none", border: "none", borderRadius: nav.big ? "50%" : 0, width: nav.big ? 52 : "auto", height: nav.big ? 52 : "auto", justifyContent: "center", marginTop: nav.big ? -16 : 0, boxShadow: nav.big ? "0 4px 20px rgba(255,87,51,0.45)" : "none" }}>
              <span style={{ fontSize: nav.big ? 22 : 20, color: nav.big ? "#fff" : (screen === nav.id ? "var(--accent)" : "var(--text3)") }}>{nav.emoji}</span>
              {!nav.big && <span style={{ fontSize: 11, fontWeight: 600, color: screen === nav.id ? "var(--accent)" : "var(--text3)" }}>{nav.label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ user, isMe, onBack, myName, setMyName, joined, events }) {
  const [profileTab, setProfileTab] = useState("photos");
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [allUserEvents, setAllUserEvents] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "", location: "", age: "", instagram: "" });
  const myEvents = allUserEvents.filter(e => e.hostId === user?.id);
  const joinedEvents = allUserEvents.filter(e => e.members.includes(user?.id) && e.hostId !== user?.id);

  const uploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file || !isMe) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { console.error(uploadError); setUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setAvatarUrl(publicUrl); setUploading(false);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ full_name: editForm.full_name, bio: editForm.bio, location: editForm.location, age: editForm.age ? parseInt(editForm.age) : null, instagram: editForm.instagram }).eq("id", user.id);
    if (error) { console.error(error); return; }
    setProfile({ ...profile, ...editForm });
    if (editForm.full_name && editForm.full_name !== myName) setMyName(editForm.full_name);
    setEditing(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          setEditForm({ full_name: data.full_name || "", bio: data.bio || "", location: data.location || "", age: data.age || "", instagram: data.instagram || "" });
        }
      });
    supabase.from("events").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAllUserEvents(data.map(e => ({ ...e, groupSize: e.group_size, maxSize: e.max_size, host: e.host_name, hostId: e.host_id, members: e.members || [], memberNames: e.member_names || [] })));
      });
  }, [user?.id]);

  const displayName = isMe ? myName : (profile?.full_name || user?.name || "");
  const displayUsername = isMe ? (myName ? myName.toLowerCase().replace(/\s+/g, "") : "you") : (profile?.username || "");

  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100, background: "var(--bg)", minHeight: "100vh" }}>
      <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a0800, #2d1200)" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.12, fontSize: 34, display: "flex", flexWrap: "wrap", gap: 14, padding: 16, filter: "blur(1px)", lineHeight: 1 }}>
          {["🪩","🏃","🏖️","🎨","🍻","⛺","🎭","🚴","🧘","🏄","🎸","🥾"].map((e, i) => <span key={i}>{e}</span>)}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,87,51,0.15), transparent)" }} />
        {!isMe && (
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <button className="btn" onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>← Back</button>
          </div>
        )}
        {isMe && !editing && (
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
            <div onClick={() => setEditing(true)} style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>Edit</div>
            <div onClick={async () => { await supabase.auth.signOut(); }} style={{ background: "rgba(239,68,68,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#ef4444", cursor: "pointer" }}>Log out</div>
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px", marginTop: -36 }}>
        <label style={{ cursor: isMe ? "pointer" : "default", display: "inline-block", position: "relative" }}>
          {isMe && <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />}
          <div className="avatar-ring" style={{ width: 72, height: 72, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontSize: 28, fontWeight: 800, border: "3px solid var(--bg)", boxShadow: "0 0 30px rgba(255,87,51,0.4)", overflow: "hidden", position: "relative" }}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (displayName ? displayName[0].toUpperCase() : "?")}
            {uploading && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>...</div>}
          </div>
          {isMe && <div style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>+</div>}
        </label>
      </div>

      <div style={{ padding: "12px 20px 0" }}>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Your name" />
            <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Write a short bio..." rows={3} style={{ resize: "none" }} />
            <input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} placeholder="Your city" />
            <input value={editForm.age} onChange={e => setEditForm({ ...editForm, age: e.target.value })} placeholder="Your age" type="number" min="16" max="99" />
            <input value={editForm.instagram} onChange={e => setEditForm({ ...editForm, instagram: e.target.value.replace("@", "") })} placeholder="Instagram username (without @)" />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={saveProfile} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", border: "none" }}>Save</button>
              <button className="btn" onClick={() => setEditing(false)} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border2)" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, color: "#fff" }}>{profile?.full_name || displayName}</h2>
            <p style={{ color: "var(--text3)", fontSize: 13, marginTop: 2 }}>@{displayUsername}</p>
            {profile?.bio && <p style={{ fontSize: 14, color: "var(--text2)", marginTop: 8, lineHeight: 1.6 }}>{profile.bio}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              {profile?.total_ratings > 0 && <span style={{ fontSize: 12, color: "var(--text3)" }}>⭐ {profile.avg_rating} · {profile.total_ratings} ratings</span>}
              {profile?.location && <span style={{ fontSize: 12, color: "var(--text3)" }}>📍 {profile.location}</span>}
              {profile?.age && <span style={{ fontSize: 12, color: "var(--text3)" }}>🎂 {profile.age} years old</span>}
              {profile?.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--text3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                  @{profile.instagram}
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 32, marginTop: 20 }}>
          {[["Activities", myEvents.length], ["Followers", 0], ["Following", 0]].map(([label, val]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div className="display" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{val}</div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 22, borderBottom: "1px solid var(--border2)" }}>
          {[["photos", "📸 Photos"], ["history", "🎯 Hosted"], ["joined", "✅ Joined"]].map(([id, label]) => (
            <button key={id} className="btn" onClick={() => setProfileTab(id)} style={{ padding: "9px 16px", borderRadius: "10px 10px 0 0", fontSize: 13, fontWeight: 600, background: profileTab === id ? "var(--accent)" : "transparent", color: profileTab === id ? "#fff" : "var(--text3)", border: "none", marginBottom: -1 }}>{label}</button>
          ))}
        </div>

        {profileTab === "photos" && (
          <div className="fade-in" style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
            <p style={{ fontWeight: 600, color: "var(--text2)" }}>No photos yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Photos from activities will appear here</p>
          </div>
        )}

        {profileTab === "history" && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            {myEvents.length > 0 ? myEvents.map((e, i) => (
              <div key={i} className="card shadow-sm" style={{ padding: 14, marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", background: `${e.color || "var(--accent)"}15`, flexShrink: 0 }}>{e.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{e.time && e.time !== "TBD" ? new Date(e.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : e.time} · {e.groupSize} people</div>
                </div>
                <span style={{ background: `${e.color || "var(--accent)"}15`, color: e.color || "var(--accent)", borderRadius: 100, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>{e.type}</span>
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <p style={{ fontWeight: 600, color: "var(--text2)" }}>No activities yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Create or join an event to get started</p>
              </div>
            )}
          </div>
        )}

        {profileTab === "joined" && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            {joinedEvents.length > 0 ? joinedEvents.map((e, i) => (
              <div key={i} className="card shadow-sm" style={{ padding: 14, marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", background: `${e.color || "var(--accent)"}15`, flexShrink: 0 }}>{e.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{e.time && e.time !== "TBD" ? new Date(e.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : e.time} · {e.groupSize} people</div>
                </div>
                <span style={{ background: `${e.color || "var(--accent)"}15`, color: e.color || "var(--accent)", borderRadius: 100, padding: "3px 9px", fontSize: 11, fontWeight: 600 }}>{e.type}</span>
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ fontWeight: 600, color: "var(--text2)" }}>No joined events yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Events you join will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}