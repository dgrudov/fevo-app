import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LocationInput from "./LocationInput";
import Chat from "./Chat";




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

const MOCK_USERS = [
  {
    id: "u1",
    name: "Alex Rivera",
    username: "alexrivera",
    avatar: "AR",
    bio: "Always down for a beach day or a late night out 🌊🪩 London based",
    location: "London, UK",
    followers: 312,
    following: 189,
    gradient: "linear-gradient(135deg, #FF3CAC, #784BA0)",
    photos: ["🏖️", "🪩", "🏃", "🍜", "⛺", "🎸"],
    activityHistory: [
      { title: "Disco Night @ Fabric", type: "Disco / Club", emoji: "🪩", date: "Feb 28", attendees: 12 },
      { title: "Sunrise Run – Hyde Park", type: "Morning Run", emoji: "🏃", date: "Feb 25", attendees: 6 },
      { title: "Beach Day – Brighton", type: "Beach Day", emoji: "🏖️", date: "Feb 20", attendees: 9 },
      { title: "Ramen Tour Soho", type: "Food Tour", emoji: "🍜", date: "Feb 14", attendees: 5 },
      { title: "Lake District Hike", type: "Hiking", emoji: "🥾", date: "Jan 30", attendees: 8 },
    ],
  },
  {
    id: "u2",
    name: "Maya Chen",
    username: "mayachen",
    avatar: "MC",
    bio: "Yoga teacher & weekend adventurer 🧘 Coffee snob ☕ she/her",
    location: "Barcelona, ES",
    followers: 891,
    following: 234,
    gradient: "linear-gradient(135deg, #2dd4bf, #0ea5e9)",
    photos: ["🧘", "☕", "🎨", "🥾", "🍷", "🏄"],
    activityHistory: [
      { title: "Sunrise Yoga – Barceloneta", type: "Yoga", emoji: "🧘", date: "Mar 1", attendees: 15 },
      { title: "Surf Session – Costa Brava", type: "Surf", emoji: "🏄", date: "Feb 22", attendees: 7 },
      { title: "Wine Tasting – Penedès", type: "Wine Tasting", emoji: "🍷", date: "Feb 18", attendees: 10 },
      { title: "Art Gallery Hop", type: "Art Gallery", emoji: "🎨", date: "Feb 10", attendees: 4 },
    ],
  },
];

const MOCK_EVENTS = [
  { id: 1, title: "Sunrise Coastal Run", type: "Morning Run", emoji: "🏃", host: "Alex Rivera", hostId: "u1", hostAvatar: "AR", hostGradient: "linear-gradient(135deg, #FF3CAC, #784BA0)", groupSize: 3, maxSize: 10, members: ["Alex", "Jordan", "Sam"], time: "Tomorrow, 6:30AM", location: "Brighton Beach", vibe: "Easy pace, all welcome", color: "#10b981", category: "Sports" },
  { id: 2, title: "Disco Night @ Fabric", type: "Disco / Club", emoji: "🪩", host: "Maya Chen", hostId: "u2", hostAvatar: "MC", hostGradient: "linear-gradient(135deg, #2dd4bf, #0ea5e9)", groupSize: 4, maxSize: 8, members: ["Maya", "Chris", "Lena", "Raj"], time: "Tonight, 11PM", location: "Fabric, London", vibe: "Deep House & Techno", color: "#FF3CAC", category: "Nightlife" },
  { id: 3, title: "Bondi-style Beach Day", type: "Beach Day", emoji: "🏖️", host: "Alex Rivera", hostId: "u1", hostAvatar: "AR", hostGradient: "linear-gradient(135deg, #FF3CAC, #784BA0)", groupSize: 5, maxSize: 12, members: ["Alex", "Zoe", "Tom", "Nina", "Luke"], time: "Sat, 11AM", location: "Brighton Beach", vibe: "Sun, snacks & volleyball", color: "#fbbf24", category: "Beach" },
  { id: 4, title: "Morning Yoga Flow", type: "Yoga", emoji: "🧘", host: "Maya Chen", hostId: "u2", hostAvatar: "MC", hostGradient: "linear-gradient(135deg, #2dd4bf, #0ea5e9)", groupSize: 6, maxSize: 15, members: ["Maya", "Sara", "Ben", "Ines", "Paul", "Kira"], time: "Sun, 8AM", location: "Regent's Park", vibe: "All levels, bring a mat", color: "#2dd4bf", category: "Wellness" },
  { id: 5, title: "Peak District Hike", type: "Hiking", emoji: "🥾", host: "Alex Rivera", hostId: "u1", hostAvatar: "AR", hostGradient: "linear-gradient(135deg, #FF3CAC, #784BA0)", groupSize: 4, maxSize: 8, members: ["Alex", "Dan", "Fiona", "Mo"], time: "Sat, 9AM", location: "Peak District, UK", vibe: "Moderate trail, 12km", color: "#78716c", category: "Outdoors" },
  { id: 6, title: "Sunday Brunch Crawl", type: "Brunch", emoji: "🥞", host: "Maya Chen", hostId: "u2", hostAvatar: "MC", hostGradient: "linear-gradient(135deg, #2dd4bf, #0ea5e9)", groupSize: 3, maxSize: 8, members: ["Maya", "Chris", "Ana"], time: "Sun, 10AM", location: "Shoreditch, London", vibe: "3 stops, unlimited coffee", color: "#fb923c", category: "Food & Drink" },
  { id: 7, title: "5-a-side Football", type: "Football", emoji: "⚽", host: "Alex Rivera", hostId: "u1", hostAvatar: "AR", hostGradient: "linear-gradient(135deg, #FF3CAC, #784BA0)", groupSize: 6, maxSize: 10, members: ["Alex", "Jordan", "Sam", "Raj", "Tom", "Lena"], time: "Tue, 7PM", location: "Powerleague, Shoreditch", vibe: "Casual, mixed ability", color: "#22c55e", category: "Sports" },
  { id: 8, title: "Jazz & Wine Evening", type: "Live Music", emoji: "🎸", host: "Maya Chen", hostId: "u2", hostAvatar: "MC", hostGradient: "linear-gradient(135deg, #2dd4bf, #0ea5e9)", groupSize: 2, maxSize: 6, members: ["Maya", "Ben"], time: "Fri, 8PM", location: "Ronnie Scott's, Soho", vibe: "Relaxed & sophisticated", color: "#f43f5e", category: "Culture" },
];



// custom hook for back button
function useBackButton(callback) {
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      window.history.pushState(null, "", window.location.href);
      callback();
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [callback]);
}


export default function App() {
  const [screen, setScreen] = useState("explore");
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [users] = useState(MOCK_USERS);
  const [filterCat, setFilterCat] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [myName, setMyName] = useState("");
  const [myGroupSize, setMyGroupSize] = useState(1);
  const [joined, setJoined] = useState(null);
  const [createStep, setCreateStep] = useState(1);
const [createForm, setCreateForm] = useState({ title: "", type: "", time: "", timeDate: null, location: "", vibe: "", maxSize: 8, category: "" });  const [activityFilter, setActivityFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
const [authReady, setAuthReady] = useState(false);
const [joinRequests, setJoinRequests] = useState([]);
const [myRequests, setMyRequests] = useState([]);
const [now, setNow] = useState(new Date());



  const navigateTo = (newScreen, opts = {}) => {
    window.history.pushState({ screen: newScreen }, "", window.location.href);
    setScreen(newScreen);
    if (opts.event !== undefined) setSelectedEvent(opts.event);
    if (opts.user !== undefined) setViewingUser(opts.user);
    if (opts.step !== undefined) setCreateStep(opts.step);
  };

  useEffect(() => {
    window.history.pushState({ screen: "explore" }, "", window.location.href);
  }, []);


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
      else { window.history.pushState(null, "", window.location.href); }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [screen]);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setUser(session.user);
      supabase.from("profiles").select("full_name").eq("id", session.user.id).single()
        .then(({ data }) => { if (data) setMyName(data.full_name || ""); });
    }
    setAuthReady(true);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user || null);
  });
  return () => subscription.unsubscribe();
}, []);



useEffect(() => {
  if (!user) return;
  const loadEvents = async () => {
    const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    const formatted = data.map(e => ({
      ...e,
      groupSize: e.group_size,
      maxSize: e.max_size,
      host: e.host_name,
      hostId: e.host_id,
      hostAvatar: e.host_name ? e.host_name[0].toUpperCase() : "?",
      hostGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      members: e.members || [],
      memberNames: e.member_names || [],
    }));
const activeEvents = formatted.filter(e => {
  if (!e.time || e.time === "TBD") return true;
  const parsed = new Date(e.time);
  if (isNaN(parsed.getTime())) return true; // old format events, keep them
  return parsed > new Date();
});
setEvents(activeEvents);
  };
  loadEvents();
}, [user]);



useEffect(() => {
  if (!user) return;
  const loadRequests = async () => {
    const { data, error } = await supabase
      .from("join_requests")
      .select("*")
      .eq("status", "pending");
    if (error) { console.error(error); return; }
    setJoinRequests(data || []);
    setMyRequests(data.filter(r => r.user_id === user.id).map(r => r.event_id));
  };
  loadRequests();
}, [user]);



  const ME = {
    id: "me", name: myName || "You", username: myName ? myName.toLowerCase().replace(" ", "") : "you",
    avatar: myName ? myName[0].toUpperCase() : "?",
    bio: "Ready for anything 🌍",
    location: "Sofia, BG",
    followers: 0, following: 0,
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    photos: [],
    activityHistory: joined ? [{ title: joined.title, type: joined.type, emoji: joined.emoji, date: "Today", attendees: joined.groupSize }] : [],
  };

  const filteredEvents = events.filter(e => filterCat === "All" || e.category === filterCat);
  const spotsLeft = e => e.maxSize - e.groupSize;

  const handleJoin = async (event) => {
  if (!user) return;

if (event.hostId === user.id) {
    const updatedMembers = [...event.members, user.id];
    const updatedNames = [...(event.memberNames || []), myName];
    const updatedSize = event.groupSize + 1;
    await supabase.from("events").update({
      members: updatedMembers,
      member_names: updatedNames,
      group_size: updatedSize,
    }).eq("id", event.id);
    setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
    setSelectedEvent({ ...event, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames });
    setToast("Welcome back to your event! 👑");
    setTimeout(() => setToast(null), 3000);
    return;
  }


  if (event.members.includes(user.id)) {
    setToast("You're already in this squad 👀");
    setTimeout(() => setToast(null), 3000);
    return;
  }

  if (event.groupSize >= event.maxSize) {
    setToast("This event is full 😔");
    setTimeout(() => setToast(null), 3000);
    return;
  }

  // Check if already requested
  const { data: existing } = await supabase
    .from("join_requests")
    .select("*")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .single();

 if (existing) {
    await supabase.from("join_requests").delete().eq("event_id", event.id).eq("user_id", user.id);
    setMyRequests(myRequests.filter(id => id !== event.id));
  }
  const { error } = await supabase.from("join_requests").insert({
    event_id: event.id,
    user_id: user.id,
    user_name: myName,
    status: "pending",
  });

  if (error) { console.error(error); return; }


  setMyRequests([...myRequests, event.id]);
  setToast("Request sent! Waiting for approval 🙌");
  setTimeout(() => setToast(null), 3000);
};



const handleLeave = async (event) => {
  if (!user) return;
  const updatedMembers = event.members.filter(m => m !== user.id);
  const updatedNames = (event.memberNames || []).filter(m => m !== myName);
  const updatedSize = event.groupSize - 1;

  const { error } = await supabase.from("events").update({
    members: updatedMembers,
    member_names: updatedNames,
    group_size: updatedSize,
  }).eq("id", event.id);

  if (error) { console.error(error); return; }

await supabase.from("join_requests").delete().eq("event_id", event.id).eq("user_id", user.id);


  const updated = events.map(e => e.id === event.id
    ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames }
    : e);
  setEvents(updated);
  setJoined(null);
  setScreen("explore");
  setSelectedEvent(null);
  setMyRequests(myRequests.filter(id => id !== event.id));
  setToast(`You left "${event.title}"`);
  setTimeout(() => setToast(null), 3000);
};

  const formattedTime = createForm.time ? new Date(createForm.time).toISOString() : "TBD";
  const handleCreate = async () => {
  if (!createForm.title || !myName || !createForm.type || !createForm.time || !createForm.location) return;
  const typeData = ACTIVITY_TYPES.find(t => t.label === createForm.type) || ACTIVITY_TYPES[0];
  const newEvent = {
    title: createForm.title,
    type: createForm.type,
    emoji: typeData.emoji,
    category: typeData.category,
    color: typeData.color,
    host_id: user.id,
    host_name: myName,
    time: formattedTime,
    location: createForm.location || "TBD",
    vibe: createForm.vibe || "",
    group_size: 1,
    max_size: parseInt(createForm.maxSize) || 8,
    members: [user.id],
    member_names: [myName],
  };
  const { data, error } = await supabase.from("events").insert(newEvent).select().single();
  if (error) { console.error(error); return; }
  const formatted = {
    ...data,
    groupSize: data.group_size,
    maxSize: data.max_size,
    host: data.host_name,
    hostId: data.host_id,
    hostAvatar: myName[0].toUpperCase(),
    hostGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    members: data.members || [],
    memberNames: data.member_names || [],
  };
  setEvents([formatted, ...events]);
  setJoined(formatted);
  setCreateForm({ title: "", type: "", time: "", timeDate: null, location: "", vibe: "", maxSize: 8, category: "" });  setCreateStep(1);
  setScreen("explore");
  setToast("Event created! 🎉");
  setTimeout(() => setToast(null), 3000);
};


  const selectedType = ACTIVITY_TYPES.find(t => t.label === createForm.type);

if (!authReady) return (
  <div style={{ minHeight: "100vh", background: "#f8f5f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ fontSize: 40 }}>🌍</div>
  </div>
);

if (!user) return (
  <Auth onLogin={(u, name) => { setUser(u); setMyName(name); }} />
);


  return (
    <div style={{ minHeight: "100vh", background: "#f8f5f0", fontFamily: "'DM Sans', sans-serif", color: "#1a1209" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .display { font-family: 'Clash Display', 'Georgia', serif; }
        .btn { cursor: pointer; border: none; outline: none; transition: all 0.18s cubic-bezier(.4,0,.2,1); }
        .btn:hover { transform: translateY(-2px); }
        .btn:active { transform: translateY(0) scale(0.98); }
        .card { background: #fff; border-radius: 20px; border: 1px solid rgba(0,0,0,0.06); }
        .shadow { box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .shadow-sm { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        input, select, textarea { background: #faf9f7; border: 1.5px solid #e8e3db; color: #1a1209; border-radius: 12px; padding: 12px 16px; font-size: 15px; width: 100%; outline: none; font-family: 'DM Sans', sans-serif; transition: border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #1a1209; background: #fff; }
        input::placeholder, textarea::placeholder { color: #a89f92; }
        select option { background: #fff; }
        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .chip { display: inline-flex; align-items: center; gap: 5px; background: rgba(26,18,9,0.06); border-radius: 100px; padding: 5px 12px; font-size: 13px; color: #5a4e40; font-weight: 500; }
        .avatar-ring { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .tab-btn { cursor: pointer; padding: 8px 18px; border-radius: 100px; font-size: 14px; font-weight: 600; transition: all 0.18s; border: none; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; border-radius: 12px; overflow: hidden; }
        .photo-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 32px; background: rgba(26,18,9,0.04); cursor: pointer; transition: all 0.2s; }
        .photo-cell:hover { background: rgba(26,18,9,0.08); transform: scale(1.05); }
        .activity-type-btn { cursor: pointer; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; border: 2px solid transparent; transition: all 0.18s; }
        .activity-type-btn:hover { border-color: rgba(26,18,9,0.15); }
        .progress { height: 5px; border-radius: 100px; background: rgba(26,18,9,0.08); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s ease; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: rgba(248,245,240,0.92); backdrop-filter: blur(20px); border-top: 1px solid rgba(0,0,0,0.08); padding: 12px 24px 20px; display: flex; justify-content: space-around; z-index: 200; }
        .stagger-1 { animation: fadeIn 0.35s ease 0.05s both; }
        .stagger-2 { animation: fadeIn 0.35s ease 0.1s both; }
        .stagger-3 { animation: fadeIn 0.35s ease 0.15s both; }
        .stagger-4 { animation: fadeIn 0.35s ease 0.2s both; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* EXPLORE */}
      {screen === "explore" && (
        <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
          <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Explore</h1>
              <p style={{ color: "#8a7a6a", fontSize: 14, marginTop: 2 }}>{filteredEvents.length} events near you</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {joined && (
                <div style={{ background: "#10b981", borderRadius: 100, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  ✓ Joined
                </div>
              )}

{joinRequests.filter(r => events.find(e => e.id === r.event_id && e.hostId === user?.id)).length > 0 && (
  <button className="btn" onClick={() => navigateTo("requests")} style={{
    background: "#ef4444", borderRadius: 100, padding: "6px 12px",
    fontSize: 12, fontWeight: 700, color: "#fff", position: "relative",
  }}>
    🔔 {joinRequests.filter(r => events.find(e => e.id === r.event_id && e.hostId === user?.id)).length} requests
  </button>
)}


              <div className="avatar-ring btn" onClick={() => navigateTo("profile")} style={{
                width: 40, height: 40, background: ME.gradient, color: "#fff", fontSize: 15,
                boxShadow: "0 0 0 2px #f8f5f0, 0 0 0 4px #1a1209",
              }}>{ME.avatar}</div>
            </div>
          </div>

          <div style={{ overflowX: "auto", padding: "16px 20px 0", display: "flex", gap: 8 }}>
            {ACTIVITY_CATEGORIES.map(cat => (
              <button key={cat.label} className="tab-btn" onClick={() => setFilterCat(cat.label)} style={{
                flexShrink: 0,
                background: filterCat === cat.label ? "#1a1209" : "#fff",
                color: filterCat === cat.label ? "#f8f5f0" : "#5a4e40",
                border: filterCat === cat.label ? "none" : "1px solid #e8e3db",
                fontSize: 13,
              }}>{cat.emoji} {cat.label}</button>
            ))}
          </div>

          <div style={{ padding: "16px 20px 0" }}>
            {filteredEvents.map((event, i) => (
              <div key={event.id} className={`card shadow-sm btn stagger-${Math.min(i + 1, 4)}`}
                onClick={() => navigateTo("event", { event })}
                style={{ padding: 20, marginBottom: 14, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, fontSize: 26,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `${event.color}18`, border: `1.5px solid ${event.color}30`,
                    }}>{event.emoji}</div>
                    <div>
                      <div className="display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: -0.3, lineHeight: 1.2 }}>{event.title}</div>
                      <div style={{ color: "#8a7a6a", fontSize: 13, marginTop: 3, display: "flex", gap: 5, alignItems: "center" }}>
                        <div className="avatar-ring" style={{ width: 18, height: 18, background: event.hostGradient, color: "#fff", fontSize: 8 }}>{event.hostAvatar}</div>
                        {event.host}
                      </div>
                    </div>
                  </div>
                  <span style={{ background: `${event.color}15`, color: event.color, borderRadius: 100, padding: "4px 10px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {event.emoji} {event.type}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  <span className="chip">🕐 {event.time && event.time !== "TBD" ? new Date(event.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : event.time}</span>
                  <span className="chip">📍 {event.location}</span>
                  {event.vibe && <span className="chip">✨ {event.vibe}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                     {(event.memberNames || event.members || []).slice(0, 5).map((m, j) => (
                        <div key={j} className="avatar-ring" style={{
                          width: 26, height: 26, marginLeft: j > 0 ? -9 : 0, fontSize: 10,
                          background: event.color + "55", border: "2px solid #fff",
                          color: "#fff", zIndex: 5 - j, fontWeight: 700,
                        }}>{m[0].toUpperCase()}</div>
                      ))}
                      {event.members.length > 5 && (
                        <div className="avatar-ring" style={{ width: 26, height: 26, marginLeft: -9, fontSize: 9, background: "#e8e3db", border: "2px solid #fff", color: "#5a4e40", fontWeight: 700, zIndex: 0 }}>
                          +{event.members.length - 5}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: "#8a7a6a" }}>{event.groupSize} joined</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: spotsLeft(event) <= 2 ? "#ef4444" : "#10b981" }}>
                    {spotsLeft(event)} spots left
                  </span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: `${(event.groupSize / event.maxSize) * 100}%`, background: event.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EVENT DETAIL */}
      {screen === "event" && selectedEvent && (
        <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
          <div style={{ padding: "20px 20px 0" }}>
            <button className="btn card shadow-sm" onClick={() => navigateTo("explore", { event: null })} style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#5a4e40" }}>← Back</button>
          </div>
          <div style={{ margin: "16px 20px 0", borderRadius: 24, padding: 28, background: `linear-gradient(135deg, ${selectedEvent.color}18, ${selectedEvent.color}06)`, border: `1.5px solid ${selectedEvent.color}25` }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{selectedEvent.emoji}</div>
            <h2 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 6 }}>{selectedEvent.title}</h2>
            <span style={{ background: `${selectedEvent.color}20`, color: selectedEvent.color, borderRadius: 100, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>{selectedEvent.type}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              {[["🕐", selectedEvent.time && selectedEvent.time !== "TBD" ? new Date(selectedEvent.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : selectedEvent.time], ["📍", selectedEvent.location], ["✨", selectedEvent.vibe], ["👑", `Hosted by ${selectedEvent.host}`]].filter(x => x[1]).map(([icon, val], i) => (
                <div key={i} style={{ display: "flex", gap: 10, color: "#5a4e40", fontSize: 15 }}><span>{icon}</span><span>{val}</span></div>
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
    <div style={{
      margin: "16px 20px 0", padding: "14px 18px", borderRadius: 14,
      background: "linear-gradient(135deg, #1a1209, #3d2e1e)",
      color: "#f8f5f0", display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{ fontSize: 24 }}>⏱</div>
      <div>
        <div style={{ fontSize: 12, color: "#a89f92", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Starting in</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Sans', sans-serif", letterSpacing: -0.5 }}>
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`}
        </div>
      </div>
    </div>
  );
})()}
<button className="btn" onClick={() => navigateTo("chat", { event: selectedEvent })} style={{
  margin: "14px 20px 0", width: "calc(100% - 40px)", padding: 15, borderRadius: 14,
  fontSize: 15, fontWeight: 700, background: "#fff", color: "#1a1209",
  border: "2px solid #1a1209", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
}}>💬 Squad Chat</button>

          <div className="card shadow-sm" style={{ margin: "14px 20px 0", padding: 18, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
            onClick={() => { navigateTo("profileView", { user: { id: selectedEvent.hostId, name: selectedEvent.host } }); }}>
            <div className="avatar-ring" style={{ width: 48, height: 48, background: selectedEvent.hostGradient, color: "#fff", fontSize: 18 }}>{selectedEvent.hostAvatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{selectedEvent.host}</div>
              <div style={{ fontSize: 13, color: "#8a7a6a" }}>View profile →</div>
              {selectedEvent.hostId === user?.id && (
  <button className="btn" onClick={async () => {
    const { error } = await supabase.from("events").delete().eq("id", selectedEvent.id);
    if (error) { console.error(error); return; }
    setEvents(events.filter(e => e.id !== selectedEvent.id));
    setScreen("explore");
    setSelectedEvent(null);
    setToast("Event deleted");
    setTimeout(() => setToast(null), 3000);
  }} style={{
    margin: "14px 20px 0", width: "calc(100% - 40px)", padding: 15, borderRadius: 14,
    fontSize: 15, fontWeight: 700, background: "#fff", color: "#ef4444",
    border: "2px solid #ef4444",
  }}>Delete Event</button>
)}
            </div>
          </div>

          <div className="card shadow-sm" style={{ margin: "14px 20px 0", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span className="display" style={{ fontWeight: 700, fontSize: 17 }}>Squad ({selectedEvent.groupSize}/{selectedEvent.maxSize})</span>
              <span style={{ fontSize: 13, color: spotsLeft(selectedEvent) <= 2 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{spotsLeft(selectedEvent)} open</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
{(selectedEvent.memberNames && selectedEvent.memberNames.length > 0 ? selectedEvent.memberNames : selectedEvent.members).map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8f5f0", borderRadius: 100, padding: "5px 12px 5px 5px" }}>
                  <div className="avatar-ring" style={{ width: 26, height: 26, background: selectedEvent.color + "55", color: "#fff", fontSize: 10, fontWeight: 800 }}>{m[0].toUpperCase()}</div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{m}</span>
                </div>
              ))}
            </div>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${(selectedEvent.groupSize / selectedEvent.maxSize) * 100}%`, background: selectedEvent.color }} />
            </div>
          </div>

          <div className="card shadow-sm" style={{ margin: "14px 20px 0", padding: 20 }}>
            <p className="display" style={{ fontWeight: 700, marginBottom: 14, fontSize: 17 }}>Join this squad</p>
     

{selectedEvent.members.includes(user?.id) ? (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{
      width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
      background: "#f0fdf4", color: "#10b981", letterSpacing: 0.3,
      border: "2px solid #10b981", textAlign: "center",
    }}>✓ You're in this squad</div>
    <button className="btn" onClick={() => handleLeave(selectedEvent)} style={{
      width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
      background: "#fff", color: "#ef4444", letterSpacing: 0.3,
      border: "2px solid #ef4444",
    }}>Leave Event</button>
  </div>
) : selectedEvent.hostId === user?.id && selectedEvent.members.includes(user?.id) ? (
  <div style={{
    width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
    background: "#f8f5f0", color: "#8a7a6a", letterSpacing: 0.3,
    border: "2px solid #e8e3db", textAlign: "center",
  }}>👑 You're the host</div>
) : spotsLeft(selectedEvent) <= 0 ? (
  <div>
    <button disabled style={{
      width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
      background: "#e8e3db", color: "#a89f92", letterSpacing: 0.3,
      border: "none", marginBottom: 10,
    }}>Event is Full 😔</button>
    <button className="btn" onClick={() => {
      setToast("We'll notify you if a spot opens up 🔔");
      setTimeout(() => setToast(null), 3000);
    }} style={{
      width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
      background: "#fff", color: "#1a1209", letterSpacing: 0.3,
      border: "2px solid #1a1209",
    }}>🔔 Notify Me When a Spot Opens</button>
  </div>


) : selectedEvent.hostId === user?.id ? (
  <button className="btn" onClick={() => handleJoin(selectedEvent)} style={{
    width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
    background: "#1a1209", color: "#f8f5f0", letterSpacing: 0.3,
  }}>👑 Rejoin Your Event</button>
  ) : myRequests.includes(selectedEvent.id) ? (
  <div style={{
    width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
    background: "#fff9ed", color: "#f59e0b", letterSpacing: 0.3,
    border: "2px solid #f59e0b", textAlign: "center",
  }}>⏳ Request Pending</div>
) : (
  <button className="btn" onClick={() => handleJoin(selectedEvent)} style={{
    width: "100%", padding: 15, borderRadius: 14, fontSize: 16, fontWeight: 700,
    background: "#1a1209", color: "#f8f5f0", letterSpacing: 0.3,
  }}>Request to Join 🙌</button>
)}
          </div>
        </div>
      )}

      {/* CREATE */}
      {screen === "create" && (
        <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
          <div style={{ padding: "24px 20px 0" }}>
            <h1 className="display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Create Event</h1>
            <p style={{ color: "#8a7a6a", fontSize: 14, marginTop: 2 }}>Step {createStep} of 3</p>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ flex: 1, height: 4, borderRadius: 100, background: s <= createStep ? "#1a1209" : "#e8e3db", transition: "background 0.3s" }} />
              ))}
            </div>
          </div>
          <div style={{ padding: "24px 20px 0" }}>
            {createStep === 1 && (
              <div className="fade-in">
                <p style={{ fontWeight: 600, marginBottom: 16, color: "#5a4e40" }}>What are you planning?</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {ACTIVITY_CATEGORIES.slice(1).map(cat => (
                    <button key={cat.label} className="tab-btn" onClick={() => setActivityFilter(cat.label)} style={{
                      background: activityFilter === cat.label ? "#1a1209" : "#fff",
                      color: activityFilter === cat.label ? "#f8f5f0" : "#5a4e40",
                      border: activityFilter === cat.label ? "none" : "1px solid #e8e3db",
                      fontSize: 12, padding: "6px 14px",
                    }}>{cat.emoji} {cat.label}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {ACTIVITY_TYPES.filter(t => activityFilter === "All" || t.category === activityFilter).map(type => (
                    <div key={type.label} className="activity-type-btn" onClick={() => {
                      setCreateForm({ ...createForm, type: type.label, category: type.category });
                      setCreateStep(2);
                    }} style={{
                      background: createForm.type === type.label ? `${type.color}15` : "#fff",
                      border: createForm.type === type.label ? `2px solid ${type.color}` : "2px solid #e8e3db",
                    }}>
                      <span style={{ fontSize: 26 }}>{type.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3, color: "#3a2e20" }}>{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {createStep === 2 && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {selectedType && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", background: `${selectedType.color}12`, borderRadius: 14, border: `1px solid ${selectedType.color}25`, marginBottom: 4 }}>
                    <span style={{ fontSize: 28 }}>{selectedType.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{selectedType.label}</div>
                      <button className="btn" onClick={() => setCreateStep(1)} style={{ fontSize: 12, color: selectedType.color, background: "none", fontWeight: 600 }}>Change →</button>
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 13, color: "#8a7a6a", display: "block", marginBottom: 6, fontWeight: 500 }}>Your name *</label>
                  <input value={myName} onChange={e => setMyName(e.target.value)} placeholder="What's your name?" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#8a7a6a", display: "block", marginBottom: 6, fontWeight: 500 }}>Event title *</label>
                  <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} placeholder="e.g. Morning Run – Sofia" />
                </div>
             <div>
  <label style={{ fontSize: 13, color: "#8a7a6a", display: "block", marginBottom: 6, fontWeight: 500 }}>When</label>
  <DatePicker
    selected={createForm.timeDate || null}
   onChange={date => {
  setCreateForm({ ...createForm, time: date ? date.toISOString() : "", timeDate: date });
}}
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={15}
    dateFormat="EEE d MMM, HH:mm"
    minDate={new Date()}
    placeholderText="Pick a date and time"
    customInput={
      <input style={{ width: "100%", cursor: "pointer" }} readOnly />
    }
  />
</div>
                <div>
  <label style={{ fontSize: 13, color: "#8a7a6a", display: "block", marginBottom: 6, fontWeight: 500 }}>Location</label>
  <LocationInput
    value={createForm.location}
    onChange={val => setCreateForm({ ...createForm, location: val })}
    placeholder="Search for a location"
  />
</div>
                <div>
                  <label style={{ fontSize: 13, color: "#8a7a6a", display: "block", marginBottom: 6, fontWeight: 500 }}>Vibe / description</label>
                  <textarea value={createForm.vibe} onChange={e => setCreateForm({ ...createForm, vibe: e.target.value })} placeholder="Describe the plan..." rows={2} style={{ resize: "none" }} />
                </div>
                <button className="btn" onClick={() => { if (createForm.title && myName) setCreateStep(3); }} style={{
                  padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700,
                  background: createForm.title && myName ? "#1a1209" : "#e8e3db",
                  color: createForm.title && myName ? "#f8f5f0" : "#a89f92",
                }}>Continue →</button>
              </div>
            )}
            {createStep === 3 && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card shadow-sm" style={{ padding: 18, background: "#f8f5f0" }}>
                  <div className="display" style={{ fontWeight: 700, fontSize: 19, marginBottom: 4 }}>{createForm.title}</div>
                  <div style={{ color: "#8a7a6a", fontSize: 14, display: "flex", gap: 10 }}>
                    <span>🕐 {createForm.time || "TBD"}</span>
                    <span>📍 {createForm.location || "TBD"}</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#8a7a6a", display: "block", marginBottom: 6, fontWeight: 500 }}>Your group size</label>
                  <select value={myGroupSize} onChange={e => setMyGroupSize(e.target.value)}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} person{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#8a7a6a", display: "block", marginBottom: 6, fontWeight: 500 }}>Max group size (total)</label>
                  <select value={createForm.maxSize} onChange={e => setCreateForm({ ...createForm, maxSize: e.target.value })}>
                    {[4,6,8,10,12,15,20,30].map(n => <option key={n} value={n}>Up to {n} people</option>)}
                  </select>
                </div>
              {(!createForm.title || !createForm.time || !createForm.location) && (
  <p style={{ textAlign: "center", fontSize: 13, color: "#a89f92", marginBottom: 8 }}>
    {!createForm.title ? "Add a title to continue" : !createForm.time ? "Pick a date and time to continue" : "Add a location to continue"}
  </p>
)}
<button className="btn" onClick={handleCreate} disabled={!createForm.title || !createForm.time || !createForm.location} style={{
  padding: 16, borderRadius: 14, fontSize: 16, fontWeight: 700,
  background: (!createForm.title || !createForm.time || !createForm.location) ? "#e8e3db" : "linear-gradient(135deg, #1a1209, #3a2e20)",
  color: (!createForm.title || !createForm.time || !createForm.location) ? "#a89f92" : "#f8f5f0",
  letterSpacing: 0.3, marginTop: 4, cursor: (!createForm.title || !createForm.time || !createForm.location) ? "not-allowed" : "pointer",
}}>Publish Event ✨</button>
<button className="btn" onClick={() => setCreateStep(2)} style={{ padding: 12, background: "none", fontSize: 14, color: "#8a7a6a" }}>← Back</button>
</div>
            )}
          </div>
        </div>
      )}

      {/* PROFILE */}

{screen === "requests" && (
  <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
    <div style={{ padding: "20px 20px 0" }}>
      <button className="btn card shadow-sm" onClick={() => navigateTo("explore")} style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#5a4e40" }}>← Back</button>
    </div>
    <div style={{ padding: "20px 20px 0" }}>
      <h1 className="display" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Join Requests</h1>
      <p style={{ color: "#8a7a6a", fontSize: 14, marginTop: 4 }}>People who want to join your events</p>
    </div>
    <div style={{ padding: "16px 20px 0" }}>
      {joinRequests.filter(r => events.find(e => e.id === r.event_id && e.hostId === user?.id)).length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8a7a6a" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <p style={{ fontWeight: 600 }}>No pending requests</p>
        </div>
      ) : (
        joinRequests
          .filter(r => events.find(e => e.id === r.event_id && e.hostId === user?.id))
          .map(request => {
            const event = events.find(e => e.id === request.event_id);
            return (
              <div key={request.id} className="card shadow-sm" style={{ padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                  <div className="avatar-ring" style={{ width: 44, height: 44, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 16, fontWeight: 700 }}>
                    {request.user_name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{request.user_name}</div>
                    <div style={{ fontSize: 13, color: "#8a7a6a" }}>wants to join {event?.emoji} {event?.title}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn" onClick={async () => {
                    const updatedMembers = [...(event.members || []), request.user_id];
                    const updatedNames = [...(event.memberNames || []), request.user_name];
                    const updatedSize = event.groupSize + 1;
                    await supabase.from("events").update({
                      members: updatedMembers,
                      member_names: updatedNames,
                      group_size: updatedSize,
                    }).eq("id", event.id);
                    await supabase.from("join_requests").update({ status: "accepted" }).eq("id", request.id);
                    setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
                    setJoinRequests(joinRequests.filter(r => r.id !== request.id));
                    setToast(`${request.user_name} joined the squad! 🎉`);
                    setTimeout(() => setToast(null), 3000);
                  }} style={{
                    flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: "#1a1209", color: "#f8f5f0", border: "none",
                  }}>✓ Accept</button>
                  <button className="btn" onClick={async () => {
                    await supabase.from("join_requests").update({ status: "declined" }).eq("id", request.id);
                    setJoinRequests(joinRequests.filter(r => r.id !== request.id));
                    setToast(`Request declined`);
                    setTimeout(() => setToast(null), 3000);
                  }} style={{
                    flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: "#fff", color: "#ef4444", border: "2px solid #ef4444",
                  }}>✕ Decline</button>
                </div>
              </div>
            );
          })
      )}
    </div>
  </div>
)}



      {screen === "chat" && selectedEvent && (
  <Chat
    event={selectedEvent}
    user={user}
    myName={myName}
    onBack={() => navigateTo("event", { event: selectedEvent })}
  />
)}


      {(screen === "profile" || screen === "profileView") && (
  <ProfileScreen
    user={screen === "profileView" && viewingUser ? viewingUser : { id: user?.id, name: myName }}
    isMe={screen === "profile"}
    onBack={() => navigateTo(screen === "profileView" ? "event" : "explore")}
    myName={myName}
    setMyName={setMyName}
    joined={joined}
    events={events}
  />
)}
{toast && (
  <div style={{
    position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
    background: "#1a1209", color: "#f8f5f0", padding: "14px 24px",
    borderRadius: 100, fontSize: 14, fontWeight: 600, zIndex: 999,
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.3s ease",
    whiteSpace: "nowrap",
  }}>{toast}</div>
)}
      {/* BOTTOM NAV */}
      {(screen === "explore" || screen === "create" || screen === "profile") && (
        <div className="bottom-nav">
          {[
            { id: "explore", emoji: "🔍", label: "Explore" },
            { id: "create", emoji: "＋", label: "Create", big: true },
            { id: "profile", emoji: "👤", label: "Profile" },
          ].map(nav => (
            <button key={nav.id} className="btn" onClick={() => navigateTo(nav.id, { step: 1 })} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              background: nav.big ? "#1a1209" : "none", border: "none",
              borderRadius: nav.big ? "50%" : 0, width: nav.big ? 52 : "auto", height: nav.big ? 52 : "auto",
              justifyContent: "center", marginTop: nav.big ? -16 : 0,
              boxShadow: nav.big ? "0 4px 20px rgba(26,18,9,0.3)" : "none",
            }}>
              <span style={{ fontSize: nav.big ? 22 : 20, color: nav.big ? "#f8f5f0" : (screen === nav.id ? "#1a1209" : "#a89f92") }}>{nav.emoji}</span>
              {!nav.big && <span style={{ fontSize: 11, fontWeight: 600, color: screen === nav.id ? "#1a1209" : "#a89f92" }}>{nav.label}</span>}
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
  const myEvents = events ? events.filter(e => e.hostId === user?.id) : [];
  const [editing, setEditing] = useState(false);
const [editForm, setEditForm] = useState({ full_name: "", bio: "", location: "", age: "", instagram: "" });

const uploadAvatar = async (e) => {
  const file = e.target.files[0];
  if (!file || !isMe) return;
  setUploading(true);
  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/avatar.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });
  if (uploadError) { console.error(uploadError); setUploading(false); return; }
  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  setAvatarUrl(publicUrl);
  setUploading(false);
};


const saveProfile = async () => {
  const { error } = await supabase.from("profiles").update({
  full_name: editForm.full_name,
  bio: editForm.bio,
  location: editForm.location,
  age: editForm.age ? parseInt(editForm.age) : null,
  instagram: editForm.instagram,
}).eq("id", user.id);
  if (error) { console.error(error); return; }
  setProfile({ ...profile, ...editForm });
  if (editForm.full_name && editForm.full_name !== myName) {
    setMyName(editForm.full_name);
  }
  setEditing(false);
};


useEffect(() => {
  if (!user?.id) return;
  supabase.from("profiles").select("*").eq("id", user.id).single()
    .then(({ data }) => {
      if (data) {
        setProfile(data);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
       setEditForm({
  full_name: data.full_name || "",
  bio: data.bio || "",
  location: data.location || "",
  age: data.age || "",
  instagram: data.instagram || "",
});
      }
    });
}, [user?.id]);



  const displayName = isMe ? myName : (profile?.full_name || user?.name || "");
  const displayBio = isMe ? "Ready for anything 🌍" : (profile?.bio || "");
  const displayLocation = isMe ? "Sofia, BG" : (profile?.location || "");
  const displayUsername = isMe ? (myName ? myName.toLowerCase().replace(/\s+/g, "") : "you") : (profile?.username || "");

  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 100 }}>
      {!isMe && (
        <div style={{ padding: "20px 20px 0" }}>
          <button className="btn card shadow-sm" onClick={onBack} style={{ padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "#5a4e40" }}>← Back</button>
        </div>
      )}
      <div style={{ margin: isMe ? "20px 20px 0" : "16px 20px 0", position: "relative" }}>
        <div style={{ height: 120, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", opacity: 0.9 }} />
        <div style={{ position: "absolute", bottom: -28, left: 20, position: "relative", display: "inline-block" }}>
            <label style={{ cursor: isMe ? "pointer" : "default" }}>
  {isMe && <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: "none" }} />}
  <div className="avatar-ring" style={{
    width: 72, height: 72, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
    fontSize: 28, fontWeight: 800, border: "4px solid #f8f5f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)", overflow: "hidden", position: "relative",
  }}>
    {avatarUrl ? (
      <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      displayName ? displayName[0].toUpperCase() : "?"
    )}
    {uploading && (
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>...</div>
    )}
  </div>
  {isMe && (
    <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "#1a1209", border: "2px solid #f8f5f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>+</div>
  )}
</label>
        </div>
      </div>
     <div style={{ padding: "40px 20px 0" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
    <div style={{ flex: 1 }}>
      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={editForm.full_name}
            onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
            placeholder="Your name"
            style={{ background: "#f8f5f0", border: "1.5px solid #e8e3db", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1209" }}
          />
          <textarea
            value={editForm.bio}
            onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
            placeholder="Write a short bio..."
            rows={3}
            style={{ background: "#f8f5f0", border: "1.5px solid #e8e3db", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1209", resize: "none" }}
          />
          <input
            value={editForm.location}
            onChange={e => setEditForm({ ...editForm, location: e.target.value })}
            placeholder="Your city"
            style={{ background: "#f8f5f0", border: "1.5px solid #e8e3db", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1209" }}
          />
          <input
  value={editForm.age}
  onChange={e => setEditForm({ ...editForm, age: e.target.value })}
  placeholder="Your age"
  type="number"
  min="16"
  max="99"
  style={{ background: "#f8f5f0", border: "1.5px solid #e8e3db", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1209" }}
/>
<input
  value={editForm.instagram}
  onChange={e => setEditForm({ ...editForm, instagram: e.target.value.replace("@", "") })}
  placeholder="Instagram username (without @)"
  style={{ background: "#f8f5f0", border: "1.5px solid #e8e3db", borderRadius: 12, padding: "10px 14px", fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", color: "#1a1209" }}
/>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={saveProfile} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#1a1209", color: "#f8f5f0", border: "none" }}>Save</button>
            <button className="btn" onClick={() => setEditing(false)} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "#fff", color: "#1a1209", border: "2px solid #e8e3db" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="display" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.3 }}>{profile?.full_name || displayName}</h2>
          <p style={{ color: "#8a7a6a", fontSize: 14 }}>@{displayUsername}</p>
          {profile?.bio && <p style={{ fontSize: 14, color: "#5a4e40", marginTop: 6, lineHeight: 1.5 }}>{profile.bio}</p>}
<div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
  {profile?.location && <span style={{ fontSize: 13, color: "#a89f92" }}>📍 {profile.location}</span>}
  {profile?.age && <span style={{ fontSize: 13, color: "#a89f92" }}>🎂 {profile.age} years old</span>}
{profile?.instagram && (
  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#a89f92", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#a89f92" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="4" stroke="#a89f92" strokeWidth="2" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1" fill="#a89f92"/>
    </svg>
    @{profile.instagram}
  </a>
)}
</div>
        </div>
      )}
    </div>
    {isMe && !editing && (
      <div style={{ display: "flex", gap: 8 }}>
        <div onClick={() => setEditing(true)} style={{ background: "#1a1209", color: "#f8f5f0", borderRadius: 100, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Edit</div>
        <div onClick={async () => { await supabase.auth.signOut(); }} style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 100, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Log out</div>
      </div>
    )}
        </div>
        <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, color: "#3a2e20" }}>{displayBio}</p>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {displayLocation && <span className="chip">📍 {displayLocation}</span>}
          {myEvents.length > 0 && <span className="chip">🎯 {myEvents.length} activities</span>}
        </div>
        <div style={{ display: "flex", gap: 32, marginTop: 18 }}>
          {[["Activities", myEvents.length], ["Followers", 0], ["Following", 0]].map(([label, val]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div className="display" style={{ fontSize: 22, fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 12, color: "#8a7a6a", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 24, borderBottom: "2px solid #e8e3db" }}>
          {[["photos", "📸 Photos"], ["history", "📅 History"]].map(([id, label]) => (
            <button key={id} className="btn" onClick={() => setProfileTab(id)} style={{
              padding: "10px 18px", borderRadius: "10px 10px 0 0", fontSize: 14, fontWeight: 600,
              background: profileTab === id ? "#1a1209" : "transparent",
              color: profileTab === id ? "#f8f5f0" : "#8a7a6a",
              border: "none", marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>
        {profileTab === "photos" && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            <div style={{ textAlign: "center", padding: "40px 0", color: "#8a7a6a" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <p style={{ fontWeight: 600 }}>No photos yet</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Photos from activities will appear here</p>
            </div>
          </div>
        )}
        {profileTab === "history" && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            {myEvents.length > 0 ? (
              myEvents.map((e, i) => (
                <div key={i} className="card shadow-sm" style={{ padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0ece5" }}>{e.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{e.title}</div>
                    <div style={{ fontSize: 13, color: "#8a7a6a", marginTop: 2 }}>{e.time} · {e.groupSize} people</div>
                  </div>
                  <span style={{ background: "#f0ece5", color: "#5a4e40", borderRadius: 100, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>{e.type}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#8a7a6a" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <p style={{ fontWeight: 600 }}>No activities yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Create or join an event to start your history</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    
  );
}