import { useState, useEffect, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import { supabase } from "./supabase";
import Auth from "./Auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LocationInput from "./LocationInput";
import Chat from "./Chat";
import RatingModal from "./RatingModal";
import { sendNotification } from "./notificationHelper";
import { subscribeToPush } from "./pushHelper";
import Notifications from "./Notifications";
import Onboarding from "./Onboarding";

const ACTIVITY_CATEGORIES = [
  { label: "For You", emoji: "✨" },
  { label: "All", emoji: "🌍" },
  { label: "Nightlife", emoji: "🪩" },
  { label: "Sports", emoji: "⚽" },
  { label: "Food & Drink", emoji: "🍜" },
  { label: "Culture", emoji: "🎨" },
  { label: "Outdoors", emoji: "🌿" },
  { label: "Travel", emoji: "✈️" },
];

const BG_CITIES = [
  "Sofia", "Plovdiv", "Varna", "Burgas", "Stara Zagora", "Ruse", "Pleven",
  "Sliven", "Dobrich", "Shumen", "Pernik", "Haskovo", "Yambol", "Pazardzhik",
  "Blagoevgrad", "Veliko Tarnovo", "Vratsa", "Gabrovo", "Vidin", "Montana",
  "Kardzhali", "Kyustendil", "Lovech", "Targovishte", "Razgrad", "Silistra",
  "Smolyan", "Popovo", "Samokov", "Sandanski",
];


const ACTIVITY_TYPES = [
  { label: "Disco / Club", emoji: "🪩", category: "Nightlife", color: "#FF3CAC" },
  { label: "Bar Night", emoji: "🍻", category: "Nightlife", color: "#F7971E" },
  { label: "Karaoke", emoji: "🎤", category: "Nightlife", color: "#a78bfa" },
  { label: "Live Music", emoji: "🎸", category: "Nightlife", color: "#f43f5e" },
  { label: "House Party", emoji: "🏠", category: "Nightlife", color: "#ec4899" },
  { label: "Football", emoji: "⚽", category: "Sports", color: "#22c55e" },
  { label: "Basketball", emoji: "🏀", category: "Sports", color: "#f97316" },
  { label: "Tennis", emoji: "🎾", category: "Sports", color: "#84cc16" },
  { label: "Volleyball", emoji: "🏐", category: "Sports", color: "#f59e0b" },
  { label: "Padel", emoji: "🏸", category: "Sports", color: "#06b6d4" },
  { label: "Morning Run", emoji: "🏃", category: "Sports", color: "#10b981" },
  { label: "Gym Session", emoji: "💪", category: "Sports", color: "#8b5cf6" },
  { label: "Coffee", emoji: "☕", category: "Food & Drink", color: "#92400e" },
  { label: "Brunch", emoji: "🥞", category: "Food & Drink", color: "#fb923c" },
  { label: "Dinner", emoji: "🍽️", category: "Food & Drink", color: "#e879f9" },
  { label: "BBQ", emoji: "🔥", category: "Food & Drink", color: "#ef4444" },
  { label: "Wine & Chill", emoji: "🍷", category: "Food & Drink", color: "#c084fc" },
  { label: "Cinema", emoji: "🎬", category: "Culture", color: "#6366f1" },
  { label: "Theatre", emoji: "🎭", category: "Culture", color: "#a78bfa" },
  { label: "Museum", emoji: "🏛️", category: "Culture", color: "#818cf8" },
  { label: "Gaming Night", emoji: "🎮", category: "Culture", color: "#4f46e5" },
  { label: "Escape Room", emoji: "🔐", category: "Culture", color: "#f472b6" },
  { label: "Picnic", emoji: "🧺", category: "Outdoors", color: "#a3e635" },
  { label: "Hiking", emoji: "🥾", category: "Outdoors", color: "#78716c" },
  { label: "Cycling", emoji: "🚴", category: "Outdoors", color: "#06b6d4" },
  { label: "Beach Day", emoji: "🏖️", category: "Outdoors", color: "#fbbf24" },
  { label: "Camping", emoji: "⛺", category: "Outdoors", color: "#65a30d" },
  { label: "Trip / Getaway", emoji: "🚗", category: "Travel", color: "#34d399" },
];

export default function App() {
  const [screen, setScreen] = useState("explore");
  const [events, setEvents] = useState([]);
  const [filterCat, setFilterCat] = useState("For You");
  const [myInterests, setMyInterests] = useState([]);
  const [filterDate, setFilterDate] = useState("all");
  const [filterPickedDate, setFilterPickedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [myName, setMyName] = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [myGender, setMyGender] = useState("");
  const [joined, setJoined] = useState(null);
  const [createStep, setCreateStep] = useState(1);
  const [createForm, setCreateForm] = useState({ title: "", type: "", time: "", timeDate: null, location: "", vibe: "", maxSize: 8, category: "", joinType: "request", durationHours: 2 });
  const [activityFilter, setActivityFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState(null);
  const [newPasswordLoading, setNewPasswordLoading] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [now, setNow] = useState(new Date());
  const [showRating, setShowRating] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationSentRef = useRef(false);
  const touchStartX = useRef(0);
  const pendingEventRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [avatarCache, setAvatarCache] = useState({});
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [chatReturnScreen, setChatReturnScreen] = useState("event");
  const [eventPhotos, setEventPhotos] = useState([]);
  const [photoLightbox, setPhotoLightbox] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [editEventForm, setEditEventForm] = useState({});
  const [blockedIds, setBlockedIds] = useState([]);
  const [reportSheet, setReportSheet] = useState(null); // userId being reported
  const [myBuddyIds, setMyBuddyIds] = useState([]);
  const [confirmationPrompt, setConfirmationPrompt] = useState(null);
  const [eventConfirmations, setEventConfirmations] = useState([]);
  const [memberActionSheet, setMemberActionSheet] = useState(null); // { id, name }
  const [buddySuggestions, setBuddySuggestions] = useState(null); // [{ id, name, rating }]
  const [profileViewReturn, setProfileViewReturn] = useState("event");
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(() => sessionStorage.getItem("nudge_dismissed") === "1");
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const loadEventPhotos = async (eventId) => {
    const { data } = await supabase.from("event_photos").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
    setEventPhotos(data || []);
  };

  const navigateTo = (newScreen, opts = {}) => {
    const eventId = opts.event?.id ?? (newScreen === "event" ? selectedEvent?.id : null);
    const newUrl = newScreen === "event" && eventId
      ? `${window.location.pathname}?event=${eventId}`
      : window.location.pathname;
    window.history.pushState({ screen: newScreen }, "", newUrl);
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
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    if (eventId) {
      pendingEventRef.current = eventId;
      window.history.replaceState({}, "", window.location.pathname);
    }
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

    const channel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`
      }, () => { setUnreadCount(prev => prev + 1); })
      .subscribe();

    // Re-fetch when app comes back into focus (mobile background/foreground)
    const handleVisibility = () => { if (document.visibilityState === 'visible') loadUnread(); };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const screenRef = useRef(screen);
  const profileViewReturnRef = useRef(profileViewReturn);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { profileViewReturnRef.current = profileViewReturn; }, [profileViewReturn]);

  const handleBack = () => {
    const current = screenRef.current;
    if (current === "event") { setScreen("explore"); setSelectedEvent(null); }
    else if (current === "create") { setScreen("explore"); setCreateStep(1); }
    else if (current === "profile") { setScreen("explore"); }
    else if (current === "profileView") { setScreen(profileViewReturnRef.current); }
    else if (current === "chat") { setScreen("event"); }
    else if (current === "requests") { setScreen("explore"); }
    else if (current === "notifications") { setScreen("explore"); }
    else { window.history.pushState(null, "", window.location.href); }
  };

  // Native Android back button
  useEffect(() => {
    let listener;
    CapApp.addListener("backButton", handleBack).then(l => { listener = l; });
    return () => { listener?.remove(); };
  }, []);

  // Web browser back button (localhost / gruvio.app)
  useEffect(() => {
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  useEffect(() => {
    // Only check banned/onboarded on existing session load (returning users)
    // New signups are handled by the onLogin callback from Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        subscribeToPush(session.user.id);
        supabase.from("profiles").select("full_name, username, onboarded, banned, interests, bio, avatar_url, location, gender, email").eq("id", session.user.id).maybeSingle()
          .then(({ data }) => {
            if (!data) return;
            if (data.banned === true) { setIsBanned(true); return; }
            setMyName(data.full_name || "");
            setMyUsername(data.username || "");
            setMyInterests(data.interests || []);
            setMyGender(data.gender || "");
            // Backfill email for users who signed up before email was stored
            if (!data.email && session.user.email) {
              supabase.from("profiles").update({ email: session.user.email }).eq("id", session.user.id);
            }
            if (!data.onboarded) setShowOnboarding(true);
            if (!data.bio || !data.avatar_url) setProfileIncomplete(true);
          });
      }
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "PASSWORD_RECOVERY") { setPasswordRecovery(true); return; }
      if (_event === "SIGNED_IN") return; // handled by onLogin callback after profile check
      if (_event === "SIGNED_OUT") {
        setUser(null);
        setMyInterests([]);
        setMyName("");
        setProfileIncomplete(false);
        setProfileNudgeDismissed(false);
        sessionStorage.removeItem("nudge_dismissed");
        setMyBuddyIds([]);
        setJoined(null);
        setScreen("explore");
        setSelectedEvent(null);
        return;
      }
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadEvents = async () => {
      setEventsLoading(true);
      notificationSentRef.current = false;
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) { setEventsLoading(false); return; }
      const formatted = data.map(e => ({
        ...e, groupSize: e.group_size, maxSize: e.max_size, host: e.host_name, hostId: e.host_id,
        hostAvatar: e.host_name ? e.host_name[0].toUpperCase() : "?",
        hostGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        members: e.members || [], memberNames: e.member_names || [],
        joinType: e.join_type || "request",
        durationHours: e.duration_hours || 2,
        endTime: e.end_time || null,
      }));
      const activeEvents = formatted.filter(e => {
        if (e.members.includes(user.id) || e.hostId === user.id) return true;
        if (!e.time || e.time === "TBD") return true;
        const parsed = new Date(e.time);
        if (isNaN(parsed.getTime())) return true;
        return parsed > new Date();
      });
      setEvents(activeEvents);
      setEventsLoading(false);
      if (pendingEventRef.current) {
        const target = formatted.find(e => String(e.id) === String(pendingEventRef.current));
        if (target) { navigateTo("event", { event: target }); }
        pendingEventRef.current = null;
      }
      const allIds = [...new Set([
        ...(data || []).map(e => e.host_id),
        ...(data || []).flatMap(e => e.members || []),
      ].filter(Boolean))];
      if (allIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, avatar_url").in("id", allIds);
        if (profiles) {
          const cache = {};
          profiles.forEach(p => { if (p.avatar_url) cache[p.id] = p.avatar_url; });
          setAvatarCache(prev => ({ ...prev, ...cache }));
        }
      }
    };
    loadEvents();

    const eventsSub = supabase
      .channel("events-updates")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events" }, (payload) => {
        setEvents(prev => prev.map(e => e.id === payload.new.id ? {
          ...e,
          host: payload.new.host_name,
          memberNames: payload.new.member_names || [],
          members: payload.new.members || [],
          groupSize: payload.new.group_size,
          maxSize: payload.new.max_size,
        } : e));
        setSelectedEvent(prev => prev?.id === payload.new.id ? {
          ...prev,
          host: payload.new.host_name,
          memberNames: payload.new.member_names || [],
          members: payload.new.members || [],
          groupSize: payload.new.group_size,
          maxSize: payload.new.max_size,
        } : prev);
      })
      .subscribe();

    return () => supabase.removeChannel(eventsSub);
  }, [user, eventsRefreshKey]);

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
        // Auto-insert attendance for all members (showed_up=true by default, host can correct later)
        const rows = (event.members || []).map(uid => ({ event_id: event.id, user_id: uid, showed_up: true }));
        if (rows.length > 0) {
          await supabase.from("attendance").upsert(rows, { onConflict: "event_id,user_id", ignoreDuplicates: true });
        }
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
    if (!user || events.length === 0) return;
    const checkConfirmations = async () => {
      const now = new Date();
      const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const upcoming = events.filter(e => {
        if (!e.time || e.time === "TBD") return false;
        const t = new Date(e.time);
        return t > now && t <= in2h && (e.members || []).includes(user.id);
      });
      for (const event of upcoming) {
        const { data } = await supabase.from("event_confirmations").select("response").eq("event_id", event.id).eq("user_id", user.id).maybeSingle();
        if (!data) { setConfirmationPrompt(event); return; }
      }
    };
    checkConfirmations();
  }, [events, user?.id]);

  useEffect(() => {
    if (!selectedEvent?.id) return;
    supabase.from("event_confirmations").select("user_id, response").eq("event_id", selectedEvent.id)
      .then(({ data }) => setEventConfirmations(data || []));
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id)
      .then(({ data }) => { if (data) setBlockedIds(data.map(b => b.blocked_id)); });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    supabase.from("buddy_requests").select("requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted")
      .then(({ data }) => {
        if (data) setMyBuddyIds(data.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id));
      });
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const loadRequests = async () => {
      const { data, error } = await supabase.from("join_requests").select("*").eq("status", "pending");
      if (error) { console.error(error); return; }
      // Auto-delete pending requests for events that have already started
      const now = new Date();
      const eventIds = [...new Set((data || []).map(r => r.event_id))];
      let startedEventIds = [];
      if (eventIds.length > 0) {
        const { data: evData } = await supabase.from("events").select("id, time").in("id", eventIds);
        startedEventIds = (evData || []).filter(e => e.time && new Date(e.time) < now).map(e => e.id);
      }
      if (startedEventIds.length > 0) {
        const startedReqIds = (data || []).filter(r => startedEventIds.includes(r.event_id)).map(r => r.id);
        if (startedReqIds.length > 0) await supabase.from("join_requests").delete().in("id", startedReqIds);
        for (const eid of startedEventIds) {
          await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "join_request").filter("data->>event_id", "eq", String(eid));
        }
      }
      const active = (data || []).filter(r => !startedEventIds.includes(r.event_id));
      setJoinRequests(active);
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
  }, [user, screen]);

  const filteredEvents = events.filter(e => {
    if (blockedIds.includes(e.hostId)) return false;
    if (e.joinType === "buddies" && e.hostId !== user?.id && !myBuddyIds.includes(e.hostId) && !e.members.includes(user?.id)) return false;
    // Hide events that have started or ended
    if (e.time && e.time !== "TBD" && new Date(e.time) < new Date()) return false;
    if (filterCat === "For You") {
      if (myInterests.length > 0 && !myInterests.includes(e.category)) return false;
    } else if (filterCat !== "All") {
      if (e.category !== filterCat) return false;
    }
    if (filterDate === "all") return true;
    if (!e.time || e.time === "TBD") return false;
    const t = new Date(e.time);
    if (isNaN(t.getTime())) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today); dayAfterTomorrow.setDate(today.getDate() + 2);
    const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
    const saturday = new Date(today); saturday.setDate(today.getDate() + daysUntilSat);
    const endOfSunday = new Date(saturday); endOfSunday.setDate(saturday.getDate() + 1); endOfSunday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + 7);
    if (filterDate === "today") return t >= today && t < tomorrow;
    if (filterDate === "tomorrow") return t >= tomorrow && t < dayAfterTomorrow;
    if (filterDate === "week") return t >= today && t < endOfWeek;
    if (filterDate === "pick" && filterPickedDate) {
      const picked = new Date(filterPickedDate); picked.setHours(0, 0, 0, 0);
      const pickedEnd = new Date(picked); pickedEnd.setDate(picked.getDate() + 1);
      return t >= picked && t < pickedEnd;
    }
    return true;
  });
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
      setToast("Welcome back to your event!");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (event.members.includes(user.id)) { setToast("You're already in this squad"); setTimeout(() => setToast(null), 3000); return; }
    if (event.groupSize >= event.maxSize) { setToast("This event is full"); setTimeout(() => setToast(null), 3000); return; }
    const { data: existing } = await supabase.from("join_requests").select("*").eq("event_id", event.id).eq("user_id", user.id).single();
    if (existing) {
      await supabase.from("join_requests").delete().eq("event_id", event.id).eq("user_id", user.id);
      setMyRequests(myRequests.filter(id => id !== event.id));
    }
    const { error } = await supabase.from("join_requests").insert({ event_id: event.id, user_id: user.id, user_name: myName, status: "pending" });
    if (error) { console.error(error); return; }
    await sendNotification(event.hostId, "join_request", "New join request 👥", `${myName} wants to join ${event.emoji} ${event.title}`, { event_id: event.id, user_id: user.id, user_name: myName });
    setMyRequests([...myRequests, event.id]);
    setToast("Request sent!");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDirectJoin = async (event) => {
    if (!user) return;
    if (event.members.includes(user.id)) return;
    if (event.groupSize >= event.maxSize) { setToast("This event is full"); setTimeout(() => setToast(null), 3000); return; }
    const updatedMembers = [...event.members, user.id];
    const updatedNames = [...(event.memberNames || []), myName];
    const updatedSize = event.groupSize + 1;
    const { error } = await supabase.rpc("join_open_event", { p_event_id: event.id, p_user_id: user.id, p_user_name: myName });
    if (error) { console.error(error); return; }
    setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
    setSelectedEvent({ ...event, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames });
    await sendNotification(event.hostId, "join_info", "Someone joined your event", `${myName} joined ${event.emoji} ${event.title}`, { event_id: event.id });
    setToast("You joined!");
    setTimeout(() => setToast(null), 3000);
  };

  const handleLeave = async (event) => {
    if (!user) return;
    const updatedMembers = (event.members || []).filter(m => m !== user.id);
    const userIdx = (event.members || []).indexOf(user.id);
    const updatedNames = (event.memberNames || []).filter((_, i) => i !== userIdx);
    const updatedSize = Math.max(0, (event.groupSize || 1) - 1);
    const { error } = await supabase.from("events").update({ members: updatedMembers, member_names: updatedNames, group_size: updatedSize }).eq("id", event.id);
    if (error) { console.error("leave error:", error); setToast("Could not leave event"); setTimeout(() => setToast(null), 3000); return; }
    await supabase.from("join_requests").delete().eq("event_id", event.id).eq("user_id", user.id);
    setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
    setMyRequests(prev => prev.filter(id => id !== event.id));
    setJoined(null); setScreen("explore"); setSelectedEvent(null);
    setToast(`You left "${event.title}"`);
    setTimeout(() => setToast(null), 3000);
  };
  const formattedTime = createForm.time ? new Date(createForm.time).toISOString() : "TBD";
  const handleCreate = async () => {
    if (!createForm.title || !myName || !createForm.type || !createForm.time || !createForm.location) return;
    const typeData = ACTIVITY_TYPES.find(t => t.label === createForm.type) || ACTIVITY_TYPES[0];
    const durationHours = createForm.durationHours || 2;
    const startDate = new Date(createForm.time);
    const endTime = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000).toISOString();
    const newEvent = {
      title: createForm.title, type: createForm.type, emoji: typeData.emoji,
      category: typeData.category, color: typeData.color, host_id: user.id, host_name: myName,
      time: formattedTime, location: createForm.location || "TBD", vibe: createForm.vibe || "",
      group_size: 1, max_size: parseInt(createForm.maxSize) || 8,
      members: [user.id], member_names: [myName],
      join_type: createForm.joinType || "request",
      duration_hours: durationHours,
      end_time: endTime,
    };
    const { data, error } = await supabase.from("events").insert(newEvent).select().single();
    if (error) { console.error(error); return; }
    const formatted = {
      ...data, groupSize: data.group_size, maxSize: data.max_size,
      host: data.host_name, hostId: data.host_id, hostAvatar: myName[0].toUpperCase(),
      hostGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      members: data.members || [], memberNames: data.member_names || [],
      joinType: data.join_type || "request",
      durationHours: data.duration_hours || 2,
      endTime: data.end_time || null,
    };
    setEvents([formatted, ...events]);
    setCreateForm({ title: "", type: "", time: "", timeDate: null, location: "", vibe: "", maxSize: 8, category: "", joinType: "request", durationHours: 2 });
    setCreateStep(1); setScreen("explore");
    setToast("Event created!");
    setTimeout(() => setToast(null), 3000);
    // Notify users with matching interests (skip in local dev)
    if (import.meta.env.PROD || window.Capacitor) {
      const apiBase = window.Capacitor ? "https://gruvio.app" : "";
      fetch(`${apiBase}/api/notify-new-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: data.id, category: newEvent.category, hostId: user.id, title: createForm.title, emoji: typeData.emoji, token: (await supabase.auth.getSession()).data.session?.access_token }),
      }).catch(() => {});
    }
    // Notify buddies about new event
    supabase.from("buddy_requests").select("requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq("status", "accepted")
      .then(({ data: buddyRows }) => {
        if (!buddyRows || buddyRows.length === 0) return;
        const buddyIds = buddyRows.map(r => r.requester_id === user.id ? r.addressee_id : r.requester_id);
        buddyIds.forEach(buddyId => sendNotification(buddyId, "buddy_event", `${myName} is hosting ${formatted.emoji} ${formatted.title} 👥`, "Want to join them?", { event_id: formatted.id }));
      });
  };

  const selectedType = ACTIVITY_TYPES.find(t => t.label === createForm.type);

  if (!authReady) return (
    <div style={{ minHeight: "100vh", background: "#0a0805", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Clash Display', Georgia, serif", fontSize: 36, fontWeight: 700, color: "#ff5733", filter: "drop-shadow(0 0 20px rgba(255,87,51,0.5))" }}>Gruvio</div>
    </div>
  );

  if (profileLoading) return (
    <div style={{ minHeight: "100vh", background: "#0a0805", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Clash Display', Georgia, serif", fontSize: 36, fontWeight: 700, color: "#ff5733", filter: "drop-shadow(0 0 20px rgba(255,87,51,0.5))" }}>Gruvio</div>
    </div>
  );

  if (passwordRecovery) return (
    <div style={{ minHeight: "100vh", background: "#0a0805", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ fontFamily: "'Clash Display', Georgia, serif", fontSize: 36, fontWeight: 700, color: "#ff5733", marginBottom: 16, filter: "drop-shadow(0 0 20px rgba(255,87,51,0.5))" }}>Gruvio</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Set New Password</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32, textAlign: "center" }}>Choose a new password for your account</div>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 12 }}>
        <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" type="password"
          style={{ background: "#1a1510", border: "1.5px solid rgba(255,120,60,0.12)", color: "#fff", borderRadius: 12, padding: "14px 16px", fontSize: 15, width: "100%", outline: "none", boxSizing: "border-box" }} />
        {newPasswordError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>{newPasswordError}</div>
        )}
        <button disabled={newPasswordLoading} onClick={async () => {
          if (newPassword.length < 6) { setNewPasswordError("Password must be at least 6 characters"); return; }
          setNewPasswordLoading(true); setNewPasswordError(null);
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          setNewPasswordLoading(false);
          if (error) { setNewPasswordError(error.message); return; }
          setPasswordRecovery(false);
          setNewPassword("");
        }} style={{ padding: 15, borderRadius: 14, border: "none", cursor: newPasswordLoading ? "not-allowed" : "pointer", background: newPasswordLoading ? "#221c14" : "linear-gradient(135deg, #ff5733, #ff8c42)", color: newPasswordLoading ? "rgba(255,255,255,0.35)" : "#fff", fontSize: 16, fontWeight: 700, boxShadow: "0 8px 24px rgba(255,87,51,0.35)" }}>
          {newPasswordLoading ? "Saving..." : "Save New Password"}
        </button>
      </div>
    </div>
  );

  if (!user) return <Auth onLogin={async (u, name, isNewUser, banned) => {
    setProfileLoading(true);
    setIsBanned(false);
    setMyInterests([]);
    setProfileIncomplete(false);
    setProfileNudgeDismissed(false);
    sessionStorage.removeItem("nudge_dismissed");
    setMyBuddyIds([]);
    setJoined(null);
    if (banned) { setIsBanned(true); setProfileLoading(false); return; }
    setMyName(name);
    if (isNewUser) setShowOnboarding(true);
    subscribeToPush(u.id);
    const { data } = await supabase.from("profiles").select("interests, bio, avatar_url, gender, username").eq("id", u.id).maybeSingle();
    if (data) {
      setMyInterests(data.interests || []);
      setMyGender(data.gender || "");
      setMyUsername(data.username || "");
      if (!data.bio || !data.avatar_url) setProfileIncomplete(true);
    }
    setUser(u);
    setProfileLoading(false);
  }} />;

  if (isBanned) return (
    <div className="phone-frame" style={{ minHeight: "100vh", background: "#0a0805", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>🚫</div>
      <h1 style={{ fontFamily: "'Clash Display', serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Account Suspended</h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 32 }}>Your account has been suspended due to violations of our community guidelines.</p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>If you believe this is a mistake, contact us at<br /><span style={{ color: "rgba(255,87,51,0.7)" }}>support@gruvio.app</span></p>
      <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 32, padding: "12px 28px", borderRadius: 100, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Sign out</button>
    </div>
  );

  if (showOnboarding) return (
    <Onboarding onFinish={async ({ interests, name, username, birthday, gender, phone }) => {
      if (phone) {
        const { data: existingPhone } = await supabase.from("profiles").select("id").eq("phone", phone).neq("id", user.id).maybeSingle();
        if (existingPhone) return { phoneError: "This phone number is already registered" };
      }
      if (username) {
        const { data: existingUsername } = await supabase.from("profiles").select("id").eq("username", username).neq("id", user.id).maybeSingle();
        if (existingUsername) return { usernameError: "This username is already taken" };
      }
      const updates = { onboarded: true, interests };
      if (name) { updates.full_name = name; setMyName(name); }
      if (username) { updates.username = username; setMyUsername(username); }
      if (birthday) updates.birthday = birthday;
      if (gender) { updates.gender = gender; setMyGender(gender); }
      if (phone) updates.phone = phone;
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) return { error: "Something went wrong, please try again" };
      setMyInterests(interests);
      setShowOnboarding(false);
      return null;
    }} />
  );

  return (
    <div className="phone-frame" style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', sans-serif", color: "var(--text)", overflowX: "hidden", paddingTop: "env(safe-area-inset-top)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow-x: hidden; width: 100%; max-width: 100%; }
        #root { overflow-x: hidden; width: 100%; max-width: 100%; }
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
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .chip { display: inline-flex; align-items: center; gap: 5px; background: var(--bg3); border: 1px solid var(--border2); border-radius: 100px; padding: 5px 12px; font-size: 13px; color: var(--text2); font-weight: 500; }
        .avatar-ring { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .tab-btn { cursor: pointer; padding: 7px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; transition: all 0.18s; border: none; }
        .progress { height: 3px; border-radius: 100px; background: var(--bg4); overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s ease; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: rgba(10,8,5,0.92); backdrop-filter: blur(20px); border-top: 1px solid var(--border2); padding: 12px 24px calc(20px + env(safe-area-inset-bottom)); display: flex; justify-content: space-around; z-index: 200; }
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
        .date-filter-picker { display: inline-flex; flex-shrink: 0; }
      `}</style>

      {/* ── EXPLORE ── */}
      {screen === "explore" && (
        <div className="fade-in" style={{ width: "100%", maxWidth: 480, margin: "0 auto", paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 300, height: 200, background: "radial-gradient(ellipse, rgba(255,87,51,0.08), transparent 70%)", pointerEvents: "none" }} />
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

          {profileIncomplete && !profileNudgeDismissed && (
            <div style={{ margin: "12px 20px 0", padding: "12px 14px", borderRadius: 14, background: "rgba(255,87,51,0.07)", border: "1px solid rgba(255,87,51,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0, color: "var(--accent)" }}>→</span>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => navigateTo("profile")}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Complete your profile</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Add a bio & photo so people know who's coming</div>
              </div>
              <button onClick={() => { setProfileNudgeDismissed(true); sessionStorage.setItem("nudge_dismissed", "1"); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 18, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>×</button>
            </div>
          )}

          <div style={{ overflowX: "auto", padding: "12px 20px 0", display: "flex", gap: 8, width: "100%", maxWidth: "100%" }}>
            {ACTIVITY_CATEGORIES.map(cat => (
              <button key={cat.label} className="tab-btn" onClick={() => setFilterCat(cat.label)} style={{ flexShrink: 0, background: filterCat === cat.label ? "var(--accent)" : "var(--bg3)", color: filterCat === cat.label ? "#fff" : "var(--text2)", border: filterCat === cat.label ? "none" : "1px solid var(--border2)", boxShadow: filterCat === cat.label ? "0 4px 16px rgba(255,87,51,0.35)" : "none" }}>{cat.emoji} {cat.label}</button>
            ))}
          </div>

          <div style={{ overflowX: "auto", padding: "10px 20px 4px", display: "flex", gap: 7, alignItems: "center", width: "100%", maxWidth: "100%" }}>
            {[
              { key: "all", label: "Any time" },
              { key: "today", label: "Today" },
              { key: "tomorrow", label: "Tomorrow" },
              { key: "week", label: "This week" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterDate(f.key)} style={{
                flexShrink: 0, cursor: "pointer", padding: "6px 14px", borderRadius: 100,
                fontSize: 12, fontWeight: 600, transition: "all 0.18s",
                background: filterDate === f.key ? "rgba(255,87,51,0.15)" : "transparent",
                color: filterDate === f.key ? "var(--accent)" : "var(--text3)",
                border: filterDate === f.key ? "1px solid rgba(255,87,51,0.3)" : "1px solid transparent",
              }}>{f.label}</button>
            ))}
            <DatePicker
              selected={filterPickedDate}
              onChange={date => { setFilterPickedDate(date); setFilterDate("pick"); }}
              minDate={new Date()}
              popperPlacement="bottom-start"
              popperProps={{ strategy: "fixed" }}
              wrapperClassName="date-filter-picker"
              customInput={
                <button style={{ cursor: "pointer", padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.18s", background: filterDate === "pick" ? "rgba(255,87,51,0.15)" : "transparent", color: filterDate === "pick" ? "var(--accent)" : "var(--text3)", border: filterDate === "pick" ? "1px solid rgba(255,87,51,0.3)" : "1px solid transparent" }}>
                  {filterDate === "pick" && filterPickedDate ? filterPickedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Pick date"}
                </button>
              }
            />
          </div>

          <div style={{ padding: "8px 16px 0" }}>
            {eventsLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="card" style={{ borderRadius: 20, padding: 18, overflow: "hidden", position: "relative" }}>
                    <div style={{ background: "linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", borderRadius: 10, height: 18, width: "60%", marginBottom: 10 }} />
                    <div style={{ background: "linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", borderRadius: 8, height: 13, width: "40%", marginBottom: 16 }} />
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      {[80, 60, 70].map((w, j) => (
                        <div key={j} style={{ background: "linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", borderRadius: 100, height: 24, width: w }} />
                      ))}
                    </div>
                    <div style={{ background: "linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", borderRadius: 6, height: 6, width: "100%" }} />
                  </div>
                ))}
              </div>
            )}
            {!eventsLoading && filteredEvents.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p className="display" style={{ fontSize: 20, fontWeight: 700, color: "var(--text2)", marginBottom: 8 }}>No events found</p>
                <p style={{ fontSize: 14, color: "var(--text3)", lineHeight: 1.5 }}>
                  {filterCat === "For You"
                    ? "No events matching your interests right now"
                    : filterDate !== "all" && filterCat !== "All"
                    ? `No ${filterCat.toLowerCase()} events ${filterDate === "today" ? "today" : filterDate === "tomorrow" ? "tomorrow" : filterDate === "weekend" ? "this weekend" : "this week"}`
                    : filterDate !== "all"
                    ? `Nothing planned ${filterDate === "today" ? "today" : filterDate === "tomorrow" ? "tomorrow" : filterDate === "weekend" ? "this weekend" : "this week"} — be the first to create one!`
                    : filterCat !== "All"
                    ? `No ${filterCat.toLowerCase()} events yet — why not host one?`
                    : "No upcoming events yet — be the first to create one!"}
                </p>
                <button className="btn" onClick={() => { setFilterDate("all"); setFilterCat(filterCat === "For You" ? "All" : "All"); setFilterPickedDate(null); }} style={{ marginTop: 20, padding: "10px 22px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: "var(--bg3)", color: "var(--accent)", border: "1px solid var(--border)" }}>
                  {filterCat === "For You" ? "Browse all events →" : "Clear filters"}
                </button>
              </div>
            )}
            {!eventsLoading && filteredEvents.map((event, i) => (
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

                  {event.vibe && <span className="chip">{event.vibe}</span>}
                  {event.joinType === "open" && <span className="chip" style={{ color: "#10b981", borderColor: "rgba(16,185,129,0.25)" }}>Open</span>}
                  {event.joinType === "buddies" && <span className="chip" style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.25)" }}>Buddies only</span>}
                  {event.joinType === "women" && <span className="chip" style={{ color: "#f472b6", borderColor: "rgba(244,114,182,0.25)" }}>Women only</span>}
                  {event.time && event.time !== "TBD" && new Date(event.time) < new Date() && <span className="chip" style={{ color: "#fb923c", borderColor: "rgba(251,146,60,0.25)" }}>Ongoing</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                      {(event.members || []).slice(0, 5).map((memberId, j) => {
                        const avatarUrl = avatarCache[memberId];
                        const name = event.memberNames?.[j] || "";
                        return avatarUrl
                          ? <img key={j} src={avatarUrl} alt={name} className="avatar-ring" style={{ width: 24, height: 24, marginLeft: j > 0 ? -8 : 0, objectFit: "cover", border: "2px solid var(--card)", zIndex: 5 - j }} />
                          : <div key={j} className="avatar-ring" style={{ width: 24, height: 24, marginLeft: j > 0 ? -8 : 0, fontSize: 9, background: event.color + "55", border: "2px solid var(--card)", color: "#fff", zIndex: 5 - j, fontWeight: 700 }}>{name ? name[0].toUpperCase() : "?"}</div>;
                      })}
                      {event.members.length > 5 && <div className="avatar-ring" style={{ width: 24, height: 24, marginLeft: -8, fontSize: 9, background: "var(--bg4)", border: "2px solid var(--card)", color: "var(--text3)", fontWeight: 700, zIndex: 0 }}>+{event.members.length - 5}</div>}
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>{event.groupSize} joined</span>
                    {(() => {
                      const buddies = event.members.map((id, i) => ({ id, name: (event.memberNames?.[i] || "").split(" ")[0] })).filter(m => myBuddyIds.includes(m.id));
                      if (!buddies.length) return null;
                      const label = buddies.length === 1 ? `${buddies[0].name} is going` : buddies.length === 2 ? `${buddies[0].name} & ${buddies[1].name} are going` : `${buddies[0].name} & ${buddies.length - 1} others are going`;
                      return <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 100, padding: "2px 8px" }}>👥 {label}</span>;
                    })()}
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
        <div className="fade-in" style={{ width: "100%", maxWidth: 480, margin: "0 auto", paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
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
              {[["🕐", selectedEvent.time && selectedEvent.time !== "TBD" ? new Date(selectedEvent.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : selectedEvent.time], ["📍", selectedEvent.location], [null, selectedEvent.vibe ? `"${selectedEvent.vibe}"` : null], [null, selectedEvent.host ? `Hosted by ${selectedEvent.host}` : null]].filter(x => x[1]).map(([icon, val], i) => (
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
                <div style={{ fontSize: 22, color: "var(--accent)", fontWeight: 900 }}>·</div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Starting in</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>{hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`}</div>
                </div>
              </div>
            );
          })()}

          {(selectedEvent.members.includes(user?.id) || selectedEvent.hostId === user?.id) && (
            <button className="btn" onClick={() => navigateTo("chat", { event: selectedEvent })} style={{ margin: "12px 16px 0", width: "calc(100% - 32px)", padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--accent)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Squad Chat</button>
          )}

          {(() => {
            const shareUrl = `${window.location.origin}/?event=${selectedEvent.id}`;
            const shareText = `Join me at "${selectedEvent.title}"! ${selectedEvent.emoji}\n🕐 ${selectedEvent.time && selectedEvent.time !== "TBD" ? new Date(selectedEvent.time).toLocaleString("bg-BG", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBD"}\n📍 ${selectedEvent.location}\n\n${shareUrl}`;
            const btnBase = { padding: "12px 0", borderRadius: 14, fontSize: 13, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, flex: 1, textDecoration: "none", cursor: "pointer", border: "1px solid" };
            return (
              <div style={{ margin: "12px 16px 0", display: "flex", gap: 8 }}>
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" style={{ ...btnBase, background: "#25D36615", color: "#25D366", borderColor: "#25D36630" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>

                <button className="btn" onClick={async () => {
                  if (navigator.share) {
                    try { await navigator.share({ title: selectedEvent.title, text: shareText, url: shareUrl }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(shareUrl);
                    setToast("Link copied!"); setTimeout(() => setToast(null), 3000);
                  }
                }} style={{ ...btnBase, background: "var(--bg3)", color: "var(--text2)", borderColor: "var(--border2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Share…
                </button>
              </div>
            );
          })()}

          <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => navigateTo("profileView", { user: { id: selectedEvent.hostId, name: selectedEvent.host } })}>
            <div className="avatar-ring" style={{ width: 46, height: 46, background: selectedEvent.hostGradient, color: "#fff", fontSize: 17, overflow: "hidden" }}>
              {avatarCache[selectedEvent.hostId] ? <img src={avatarCache[selectedEvent.hostId]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : selectedEvent.hostAvatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#fff" }}>{selectedEvent.host}</div>
              <div style={{ fontSize: 13, color: "var(--text3)" }}>View profile →</div>
            </div>
          </div>

          {selectedEvent.hostId === user?.id && (!selectedEvent.time || selectedEvent.time === "TBD" || new Date(selectedEvent.time) > new Date()) && (
            <div style={{ margin: "12px 16px 0", display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => {
                setEditEventForm({
                  title: selectedEvent.title,
                  location: selectedEvent.location || "",
                  vibe: selectedEvent.vibe || "",
                  maxSize: selectedEvent.maxSize,
                  timeDate: selectedEvent.time && selectedEvent.time !== "TBD" ? new Date(selectedEvent.time) : null,
                });
                setEditingEvent(true);
              }} style={{ flex: 1, padding: "13px 0", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "var(--bg3)", color: "#fff", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                Edit Event
              </button>
              <button className="btn" onClick={async () => {
                if (!window.confirm("Delete this event? This cannot be undone.")) return;
                const { error } = await supabase.from("events").delete().eq("id", selectedEvent.id);
                if (error) { console.error(error); return; }
                setEvents(events.filter(ev => ev.id !== selectedEvent.id));
                setScreen("explore"); setSelectedEvent(null);
                setToast("Event deleted"); setTimeout(() => setToast(null), 3000);
              }} style={{ flex: 1, padding: "13px 0", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                Delete
              </button>
            </div>
          )}

          <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 18 }}>
            {(() => {
              const isUpcoming = selectedEvent.time && new Date(selectedEvent.time) > new Date();
              const confirmedCount = eventConfirmations.filter(c => c.response === "coming").length;
              return (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Squad · {selectedEvent.groupSize}/{selectedEvent.maxSize}</span>
                    {isUpcoming && confirmedCount > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 100, padding: "2px 8px" }}>✅ {confirmedCount} confirmed</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(() => {
                      const buddies = selectedEvent.members.map((id, i) => ({ id, name: (selectedEvent.memberNames?.[i] || "").split(" ")[0] })).filter(m => myBuddyIds.includes(m.id));
                      if (!buddies.length) return null;
                      const label = buddies.length === 1 ? `${buddies[0].name} is going` : buddies.length === 2 ? `${buddies[0].name} & ${buddies[1].name} are going` : `${buddies[0].name} & ${buddies.length - 1} others are going`;
                      return <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 100, padding: "2px 8px" }}>👥 {label}</span>;
                    })()}
                    <span style={{ fontSize: 12, color: spotsLeft(selectedEvent) <= 2 ? "#ef4444" : "#10b981", fontWeight: 700 }}>{spotsLeft(selectedEvent)} open</span>
                  </div>
                </div>
              );
            })()}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {(selectedEvent.memberNames && selectedEvent.memberNames.length > 0 ? selectedEvent.memberNames : selectedEvent.members).map((m, i) => {
                const memberId = selectedEvent.members[i];
                const isCurrentUser = memberId === user?.id;
                const isHost = selectedEvent.hostId === user?.id;
                const isUpcoming = selectedEvent.time && new Date(selectedEvent.time) > new Date();
                const conf = isUpcoming ? eventConfirmations.find(c => c.user_id === memberId) : null;
                return (
                  <div key={i}
                    onClick={() => {
                      if (isHost && !isCurrentUser) { setMemberActionSheet({ id: memberId, name: m }); return; }
                      isCurrentUser ? navigateTo("profile") : navigateTo("profileView", { user: { id: memberId, name: m } });
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg3)", border: `1px solid ${conf?.response === "coming" ? "rgba(16,185,129,0.3)" : conf?.response === "not_coming" ? "rgba(239,68,68,0.3)" : "var(--border2)"}`, borderRadius: 100, padding: "4px 10px 4px 4px", cursor: "pointer" }}>
                    <div className="avatar-ring" style={{ width: 24, height: 24, background: selectedEvent.color + "55", color: "#fff", fontSize: 9, fontWeight: 800, overflow: "hidden" }}>
                      {avatarCache[memberId] ? <img src={avatarCache[memberId]} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)" }}>{m}</span>
                    {conf?.response === "coming" && <span style={{ fontSize: 11 }}>✅</span>}
                    {conf?.response === "not_coming" && <span style={{ fontSize: 11 }}>❌</span>}
                  </div>
                );
              })}
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${(selectedEvent.groupSize / selectedEvent.maxSize) * 100}%`, background: `linear-gradient(90deg, ${selectedEvent.color}, ${selectedEvent.color}99)` }} /></div>
          </div>

          {(selectedEvent.members.includes(user?.id) || selectedEvent.hostId === user?.id) && (
            <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 11, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Squad Photos</span>
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
                      const { data: row, error: dbErr } = await supabase.from("event_photos").insert({ event_id: selectedEvent.id, user_id: user.id, user_name: myName, photo_url: urlData.publicUrl, event_title: selectedEvent.title, event_emoji: selectedEvent.emoji }).select().single();
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
                  No photos yet — be the first to share!
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {eventPhotos.map((p, i) => (
                    <div key={p.id} style={{ aspectRatio: "1", borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "var(--bg3)", position: "relative" }}>
                      <img src={p.photo_url} alt="" onClick={() => setPhotoLightbox(i)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {p.user_id === user?.id && (
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          const next = !p.show_on_profile;
                          setEventPhotos(prev => prev.map(x => x.id === p.id ? { ...x, show_on_profile: next } : x));
                          const { error } = await supabase.from("event_photos").update({ show_on_profile: next }).eq("id", p.id);
                          if (error) { console.error("Bookmark error:", error); setEventPhotos(prev => prev.map(x => x.id === p.id ? { ...x, show_on_profile: !next } : x)); }
                        }} style={{ position: "absolute", top: 5, right: 5, width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: p.show_on_profile ? "var(--accent)" : "rgba(0,0,0,0.55)", color: p.show_on_profile ? "#fff" : "rgba(255,255,255,0.7)", backdropFilter: "blur(4px)", transition: "all 0.18s" }} title={p.show_on_profile ? "Remove from profile" : "Add to profile"}>
                          🔖
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(() => {
            const isPast = selectedEvent.endTime ? new Date(selectedEvent.endTime) < new Date() : false;
            const isOngoing = !isPast && selectedEvent.time && selectedEvent.time !== "TBD" && new Date(selectedEvent.time) < new Date();
            if (isPast) {
              const wasAttending = selectedEvent.members.includes(user?.id);
              return (
                <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 18 }}>
                  <div style={{ display: "flex", align: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text3)" }}>Event closed</span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 100, padding: "1px 8px" }}>Ended</span>
                  </div>
                  {wasAttending ? (
                    <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)", textAlign: "center" }}>
                      ✓ You were part of this squad
                    </div>
                  ) : (
                    <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 14, fontWeight: 600, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)", textAlign: "center", lineHeight: 1.5 }}>
                      This event has already happened.<br />
                      <span style={{ fontSize: 12, fontWeight: 400 }}>Check explore for upcoming events</span>
                    </div>
                  )}
                </div>
              );
            }
            const hasStarted = selectedEvent.time && selectedEvent.time !== "TBD" && new Date(selectedEvent.time) < new Date();
            return (
              <div className="card shadow-sm" style={{ margin: "12px 16px 0", padding: 18 }}>
                {isOngoing && <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 10, background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)", fontSize: 13, fontWeight: 700, color: "#fb923c", textAlign: "center" }}>This event is happening now</div>}
                <p style={{ fontWeight: 700, marginBottom: 14, fontSize: 11, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase" }}>Join this squad</p>
                {selectedEvent.members.includes(user?.id) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", textAlign: "center" }}>✓ You're in this squad</div>
                    <button className="btn" onClick={() => handleLeave(selectedEvent)} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Leave Event</button>
                  </div>
                ) : selectedEvent.hostId === user?.id && selectedEvent.members.includes(user?.id) ? (
                  <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)", textAlign: "center" }}>You're the host</div>
                ) : spotsLeft(selectedEvent) <= 0 ? (
                  <div>
                    <button disabled style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--text3)", border: "none", marginBottom: 10 }}>Event is Full</button>
                    <button className="btn" onClick={() => { setToast("We'll notify you if a spot opens up"); setTimeout(() => setToast(null), 3000); }} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--accent)", border: "1px solid var(--border)" }}>Notify Me When a Spot Opens</button>
                  </div>
                ) : selectedEvent.hostId === user?.id ? (
                  <button className="btn" onClick={() => handleJoin(selectedEvent)} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", boxShadow: "0 8px 24px rgba(255,87,51,0.35)" }}>Rejoin Your Event</button>
                ) : selectedEvent.joinType === "women" && myGender !== "Female" ? (
                  <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(244,114,182,0.08)", color: "#f472b6", border: "1px solid rgba(244,114,182,0.2)", textAlign: "center" }}>This event is for women only</div>
                ) : hasStarted ? (
                  <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)", textAlign: "center" }}>Event already started</div>
                ) : selectedEvent.joinType === "open" ? (
                  <button className="btn" onClick={() => handleDirectJoin(selectedEvent)} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", boxShadow: "0 8px 24px rgba(255,87,51,0.35)" }}>Join</button>
                ) : myRequests.includes(selectedEvent.id) ? (
                  <div style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", textAlign: "center" }}>Request Pending</div>
                ) : (
                  <button className="btn" onClick={() => handleJoin(selectedEvent)} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", boxShadow: "0 8px 24px rgba(255,87,51,0.35)" }}>Request to Join</button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── CREATE ── */}
      {screen === "create" && (
        <div className="fade-in" style={{ width: "100%", maxWidth: 480, margin: "0 auto", paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
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
                    <div key={type.label} className="activity-type-btn" onClick={() => { setCreateForm({ ...createForm, type: type.label, category: type.category, title: "" }); setCreateStep(2); }} style={{ background: createForm.type === type.label ? `${type.color}15` : "var(--card)", border: createForm.type === type.label ? `2px solid ${type.color}` : "1px solid var(--border2)", boxShadow: createForm.type === type.label ? `0 0 20px ${type.color}25` : "none" }}>
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
                  <DatePicker selected={createForm.timeDate || null} onChange={date => setCreateForm({ ...createForm, time: date ? date.toISOString() : "", timeDate: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="EEE d MMM, HH:mm" minDate={new Date()} placeholderText="Pick a date and time" popperPlacement="bottom-start" popperProps={{ strategy: "fixed" }} customInput={<input style={{ width: "100%", cursor: "pointer" }} readOnly />} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>LOCATION</label>
                  <LocationInput value={createForm.location} onChange={val => setCreateForm(f => ({ ...f, location: val }))} placeholder="Search for a location" />
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
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>MAX GROUP SIZE</label>
                  <select value={createForm.maxSize} onChange={e => setCreateForm({ ...createForm, maxSize: e.target.value })}>{[4, 6, 8, 10, 12, 15, 20, 30].map(n => <option key={n} value={n}>Up to {n} people</option>)}</select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 6, fontWeight: 700, letterSpacing: 1 }}>DURATION</label>
                  <select value={createForm.durationHours} onChange={e => setCreateForm({ ...createForm, durationHours: parseFloat(e.target.value) })}>
                    {[{ v: 1, l: "1 hour" }, { v: 2, l: "2 hours" }, { v: 3, l: "3 hours" }, { v: 4, l: "4 hours" }, { v: 6, l: "6 hours" }, { v: 8, l: "All day (8h)" }, { v: 48, l: "Weekend (2 days)" }].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text3)", display: "block", marginBottom: 10, fontWeight: 700, letterSpacing: 1 }}>WHO CAN JOIN</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { value: "open", label: "Open", desc: "Anyone joins instantly — no approval needed" },
                      { value: "request", label: "Request to join", desc: "You approve each person before they join" },
                      { value: "buddies", label: "Buddies only", desc: "Only your buddies can see and join this event" },
                      ...(myGender === "Female" ? [{ value: "women", label: "Women only", desc: "Only women can see and join this event" }] : []),
                    ].map(opt => (
                      <div key={opt.value} onClick={() => setCreateForm({ ...createForm, joinType: opt.value })}
                        style={{ padding: "12px 14px", borderRadius: 13, border: `1.5px solid ${createForm.joinType === opt.value ? "var(--accent)" : "var(--border2)"}`, background: createForm.joinType === opt.value ? "rgba(255,87,51,0.07)" : "var(--card)", cursor: "pointer", transition: "all 0.15s" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: createForm.joinType === opt.value ? "var(--accent)" : "#fff" }}>{opt.label}</span>
                          {createForm.joinType === opt.value && <span style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(!createForm.title || !createForm.time || !createForm.location) && (
                  <p style={{ textAlign: "center", fontSize: 13, color: "var(--text3)" }}>{!createForm.title ? "Add a title to continue" : !createForm.time ? "Pick a date and time to continue" : "Add a venue to continue"}</p>
                )}
                <button className="btn" onClick={handleCreate} disabled={!createForm.title || !createForm.time || !createForm.location} style={{ padding: 16, borderRadius: 14, fontSize: 16, fontWeight: 700, background: (!createForm.title || !createForm.time || !createForm.location) ? "var(--bg4)" : "linear-gradient(135deg, var(--accent), var(--accent2))", color: (!createForm.title || !createForm.time || !createForm.location) ? "var(--text3)" : "#fff", boxShadow: (!createForm.title || !createForm.time || !createForm.location) ? "none" : "0 8px 24px rgba(255,87,51,0.35)", cursor: (!createForm.title || !createForm.time || !createForm.location) ? "not-allowed" : "pointer" }}>Publish Event</button>
                <button className="btn" onClick={() => setCreateStep(2)} style={{ padding: 12, background: "none", fontSize: 14, color: "var(--text3)" }}>← Back</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {screen === "notifications" && (
        <Notifications user={user} myName={myName} onBack={() => navigateTo("explore")} onNavigate={(s) => navigateTo(s)} onBuddyUpdate={(id, adding) => setMyBuddyIds(prev => adding ? [...prev, id] : prev.filter(b => b !== id))}
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
          onOpenChat={async (eventId) => {
            setChatReturnScreen("notifications");
            const numId = parseInt(eventId);
            const found = events.find(e => e.id === numId);
            if (found) { navigateTo("chat", { event: found }); return; }
            const { data } = await supabase.from("events").select("*").eq("id", numId).single();
            if (data) {
              const formatted = { ...data, groupSize: data.group_size, maxSize: data.max_size, host: data.host_name, hostId: data.host_id, members: data.members || [], memberNames: data.member_names || [] };
              navigateTo("chat", { event: formatted });
            }
          }}
          onOpenEvent={async (eventId) => {
            const numId = parseInt(eventId);
            const found = events.find(e => e.id === numId);
            if (found) { navigateTo("event", { event: found }); return; }
            const { data } = await supabase.from("events").select("*").eq("id", numId).single();
            if (data) {
              const formatted = { ...data, groupSize: data.group_size, maxSize: data.max_size, host: data.host_name, hostId: data.host_id, members: data.members || [], memberNames: data.member_names || [] };
              navigateTo("event", { event: formatted });
            }
          }}
        />
      )}

      {/* ── JOIN REQUESTS ── */}
      {screen === "requests" && (
        <div className="fade-in" style={{ width: "100%", maxWidth: 480, margin: "0 auto", paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
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
                        // 1. Подготвяме новите данни за участниците
                        const updatedMembers = [...(event.members || []), request.user_id];
                        const updatedNames = [...(event.memberNames || []), request.user_name];
                        const updatedSize = (event.groupSize || 0) + 1;

                        // 2. Обновяваме таблицата 'events' директно
                        const { error: updateError } = await supabase
                          .from("events")
                          .update({
                            members: updatedMembers,
                            member_names: updatedNames,
                            group_size: updatedSize
                          })
                          .eq("id", event.id);

                        if (updateError) {
                          console.error("Update Error:", updateError);
                          setToast("Error updating event");
                          return;
                        }

                        // 3. Отбелязваме заявката като приета и трием известието
                        await supabase.from("join_requests").update({ status: "accepted" }).eq("id", request.id);
                        await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "join_request").filter("data->>event_id", "eq", request.event_id).filter("data->>user_id", "eq", request.user_id);

                        // 4. Обновяваме UI локално
                        setEvents(events.map(e => e.id === event.id ? { ...e, groupSize: updatedSize, members: updatedMembers, memberNames: updatedNames } : e));
                        setJoinRequests(joinRequests.filter(r => r.id !== request.id));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        setToast(`${request.user_name} joined the squad!`);

                        // 5. Пращаме известие на потребителя
                        await sendNotification(request.user_id, "request_accepted", "Request accepted! 🎉", `You're now in the squad for ${event.emoji} ${event.title}`, { event_id: event.id });

                        // 6. Notify the new member's buddies
                        const { data: buddyRows } = await supabase.from("buddy_requests")
                          .select("requester_id, addressee_id")
                          .or(`requester_id.eq.${request.user_id},addressee_id.eq.${request.user_id}`)
                          .eq("status", "accepted");
                        if (buddyRows && buddyRows.length > 0) {
                          const buddyIds = buddyRows.map(r => r.requester_id === request.user_id ? r.addressee_id : r.requester_id);
                          buddyIds.forEach(buddyId => sendNotification(buddyId, "buddy_event", `${request.user_name} is going to ${event.emoji} ${event.title} 👥`, "Want to join them?", { event_id: event.id }));
                        }

                        setTimeout(() => setToast(null), 3000);
                      }} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", border: "none" }}>✓ Accept</button>
                      
                      <button className="btn" onClick={async () => {
                        // При отказ: трием заявката и известието
                        await supabase.from("join_requests").update({ status: "declined" }).eq("id", request.id);
                        await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "join_request").filter("data->>event_id", "eq", request.event_id).filter("data->>user_id", "eq", request.user_id);
                        setJoinRequests(joinRequests.filter(r => r.id !== request.id));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                        setToast("Request declined"); 
                        setTimeout(() => setToast(null), 3000);
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
        <Chat event={selectedEvent} user={user} myName={myName} onBack={() => {
          const ret = chatReturnScreen;
          setChatReturnScreen("event");
          if (ret === "notifications") navigateTo("notifications");
          else navigateTo("event", { event: selectedEvent });
        }} />
      )}

      {(screen === "profile" || screen === "profileView") && (
        <ProfileScreen key={screen === "profileView" ? viewingUser?.id : user?.id} user={screen === "profileView" && viewingUser ? viewingUser : { id: user?.id, name: myName }} isMe={screen === "profile"} onBack={() => navigateTo(screen === "profileView" ? profileViewReturn : "explore")} myName={myName} setMyName={setMyName} myUsername={myUsername} setMyUsername={setMyUsername} setMyInterests={setMyInterests} joined={joined} events={events} setEvents={setEvents} selectedEvent={selectedEvent} setSelectedEvent={setSelectedEvent} blockedIds={blockedIds} onBlock={(id) => setBlockedIds(prev => [...prev, id])} onUnblock={(id) => setBlockedIds(prev => prev.filter(b => b !== id))} onReport={(id) => setReportSheet(id)} currentUserId={user?.id} myBuddyIds={myBuddyIds} onBuddyChange={(id, adding) => setMyBuddyIds(prev => adding ? [...prev, id] : prev.filter(b => b !== id))} onNavigateProfile={(u) => { setProfileViewReturn("profile"); navigateTo("profileView", { user: u }); }} onNavigateEvent={(event) => { setProfileViewReturn("profile"); navigateTo("event", { event }); }} />
      )}

      {photoLightbox !== null && eventPhotos[photoLightbox] && (() => {
        const photo = eventPhotos[photoLightbox];
        const isFirst = photoLightbox === 0;
        const isLast = photoLightbox === eventPhotos.length - 1;
        return (
          <div className="frame-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
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
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={async () => {
                    const resp = await fetch(photo.photo_url);
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `gruvio-photo-${photoLightbox + 1}.jpg`; a.click();
                    URL.revokeObjectURL(url);
                  }} style={{ background: "rgba(255,87,51,0.15)", border: "1px solid rgba(255,87,51,0.3)", color: "var(--accent)", borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>⬇ Save</button>
                  {photo.user_id === user?.id && (
                    <button onClick={async () => {
                      const next = !photo.show_on_profile;
                      setEventPhotos(prev => prev.map(x => x.id === photo.id ? { ...x, show_on_profile: next } : x));
                      const { error } = await supabase.from("event_photos").update({ show_on_profile: next }).eq("id", photo.id);
                      if (error) { console.error("Bookmark error:", error); setEventPhotos(prev => prev.map(x => x.id === photo.id ? { ...x, show_on_profile: !next } : x)); }
                    }} style={{ background: photo.show_on_profile ? "var(--accent)" : "rgba(255,255,255,0.1)", border: photo.show_on_profile ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
                      {photo.show_on_profile ? "🔖 Saved" : "🔖 Save to Profile"}
                    </button>
                  )}
                  {photo.user_id === user?.id && (
                    <button onClick={async () => {
                      if (!window.confirm("Delete this photo?")) return;
                      const storagePath = photo.photo_url.split("/event-photos/")[1]?.split("?")[0];
                      if (storagePath) await supabase.storage.from("event-photos").remove([storagePath]);
                      await supabase.from("event_photos").delete().eq("id", photo.id);
                      const newPhotos = eventPhotos.filter(x => x.id !== photo.id);
                      setEventPhotos(newPhotos);
                      if (newPhotos.length === 0) setPhotoLightbox(null);
                      else setPhotoLightbox(Math.min(photoLightbox, newPhotos.length - 1));
                    }} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🗑 Delete</button>
                  )}
                </div>
              </div>
              <button onClick={() => setPhotoLightbox(photoLightbox + 1)} disabled={isLast} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: isLast ? "rgba(255,255,255,0.2)" : "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 24, cursor: isLast ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>
          </div>
        );
      })()}

      {editingEvent && selectedEvent && (
        <div className="frame-overlay" style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={() => setEditingEvent(false)} />
          <div style={{ position: "relative", background: "var(--bg2)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 100, background: "rgba(255,255,255,0.15)", margin: "0 auto 8px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ fontSize: 28 }}>{selectedEvent.emoji}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>Edit Event</div>
                <div style={{ fontSize: 13, color: "var(--text3)" }}>Changes apply to all squad members</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Title</div>
              <input value={editEventForm.title || ""} onChange={e => setEditEventForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Date & Time</div>
              <DatePicker
                selected={editEventForm.timeDate}
                onChange={date => setEditEventForm(f => ({ ...f, timeDate: date }))}
                showTimeSelect timeFormat="HH:mm" timeIntervals={15}
                dateFormat="d MMM yyyy, HH:mm"
                minDate={new Date()}
                popperPlacement="top-start"
                popperProps={{ strategy: "fixed" }}
                customInput={<input readOnly value={editEventForm.timeDate ? editEventForm.timeDate.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""} placeholder="Pick date & time" style={{ cursor: "pointer" }} />}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Location</div>
              <LocationInput value={editEventForm.location || ""} onChange={val => setEditEventForm(f => ({ ...f, location: val }))} placeholder="Where is it?" />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Vibe</div>
              <input value={editEventForm.vibe || ""} onChange={e => setEditEventForm(f => ({ ...f, vibe: e.target.value }))} placeholder="Describe the vibe..." />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Max squad size</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setEditEventForm(f => ({ ...f, maxSize: Math.max((f.maxSize || 2) - 1, selectedEvent.groupSize) }))} style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg3)", border: "1px solid var(--border2)", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <div style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: "#fff" }}>{editEventForm.maxSize}</div>
                <button onClick={() => setEditEventForm(f => ({ ...f, maxSize: Math.min((f.maxSize || 2) + 1, 30) }))} style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg3)", border: "1px solid var(--border2)", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
              {editEventForm.maxSize <= selectedEvent.groupSize && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>Can't go below current squad size ({selectedEvent.groupSize})</div>}
            </div>

            <button className="btn" onClick={async () => {
              const updates = {
                title: editEventForm.title,
                location: editEventForm.location,
                vibe: editEventForm.vibe,
                max_size: editEventForm.maxSize,
                time: editEventForm.timeDate ? editEventForm.timeDate.toISOString() : selectedEvent.time,
              };
              const { error } = await supabase.from("events").update(updates).eq("id", selectedEvent.id);
              if (error) { console.error(error); return; }
              const updated = { ...selectedEvent, title: updates.title, location: updates.location, vibe: updates.vibe, maxSize: updates.max_size, time: updates.time };
              setSelectedEvent(updated);
              setEvents(events.map(e => e.id === selectedEvent.id ? updated : e));
              setEditingEvent(false);
              setToast("Event updated ✓"); setTimeout(() => setToast(null), 3000);
            }} style={{ width: "100%", padding: 15, borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", border: "none", boxShadow: "0 8px 24px rgba(255,87,51,0.35)", marginTop: 4 }}>
              Save Changes
            </button>
          </div>
        </div>
      )}

      {reportSheet && (
        <div className="frame-overlay" style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={() => setReportSheet(null)} />
          <div style={{ position: "relative", background: "var(--bg2)", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 100, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
            <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 4 }}>Report User</div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 20 }}>Select a reason — our team will review it</div>
            {["Inappropriate behavior", "Harassment", "Spam", "Fake profile", "Other"].map(reason => (
              <button key={reason} onClick={async () => {
                await supabase.from("reports").insert({ reporter_id: user.id, reported_id: reportSheet, reason });
                setReportSheet(null);
                setToast("Report submitted. Thank you"); setTimeout(() => setToast(null), 3000);
              }} style={{ width: "100%", padding: "14px 18px", marginBottom: 8, borderRadius: 14, background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text2)", fontSize: 15, fontWeight: 600, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {reason} <span style={{ color: "var(--text3)" }}>›</span>
              </button>
            ))}
            <button onClick={() => setReportSheet(null)} style={{ width: "100%", padding: 14, marginTop: 4, borderRadius: 14, background: "transparent", border: "1px solid var(--border2)", color: "var(--text3)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {memberActionSheet && selectedEvent && (
        <div onClick={() => setMemberActionSheet(null)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#161009", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none", padding: "20px 16px 36px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 20px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 16, paddingLeft: 4 }}>{memberActionSheet.name}</div>
            <button onClick={() => { navigateTo("profileView", { user: { id: memberActionSheet.id, name: memberActionSheet.name } }); setMemberActionSheet(null); }}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15, fontWeight: 600, background: "var(--bg3)", color: "#fff", border: "1px solid var(--border2)", cursor: "pointer", textAlign: "left", marginBottom: 10 }}>
              View Profile
            </button>
            <button onClick={async () => {
              const updatedMembers = selectedEvent.members.filter(id => id !== memberActionSheet.id);
              const updatedNames = (selectedEvent.memberNames || []).filter((_, i) => selectedEvent.members[i] !== memberActionSheet.id);
              const updatedSize = updatedMembers.length;
              await supabase.from("events").update({ members: updatedMembers, member_names: updatedNames, group_size: updatedSize }).eq("id", selectedEvent.id);
              const updated = { ...selectedEvent, members: updatedMembers, memberNames: updatedNames, groupSize: updatedSize };
              setSelectedEvent(updated);
              setEvents(prev => prev.map(e => e.id === selectedEvent.id ? updated : e));
              await sendNotification(memberActionSheet.id, "removed_from_event", "Removed from event", `You were removed from ${selectedEvent.emoji} ${selectedEvent.title}`, { event_id: selectedEvent.id });
              setMemberActionSheet(null);
            }} style={{ width: "100%", padding: "14px 16px", borderRadius: 14, fontSize: 15, fontWeight: 600, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer", textAlign: "left" }}>
              Remove from event
            </button>
          </div>
        </div>
      )}

      {confirmationPrompt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#161009", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", padding: "24px 20px 20px" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>{confirmationPrompt.emoji}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{confirmationPrompt.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                ⏰ Starts in {Math.round((new Date(confirmationPrompt.time) - new Date()) / 60000)} min — still coming?
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={async () => {
                await supabase.from("event_confirmations").upsert({ event_id: confirmationPrompt.id, user_id: user.id, response: "coming" }, { onConflict: "event_id,user_id" });
                setEventConfirmations(prev => [...prev.filter(c => c.user_id !== user.id), { user_id: user.id, response: "coming" }]);
                setConfirmationPrompt(null);
              }} style={{ width: "100%", padding: 14, borderRadius: 14, fontSize: 16, fontWeight: 700, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(16,185,129,0.3)" }}>
                I'm in!
              </button>
              <button onClick={async () => {
                await supabase.from("event_confirmations").upsert({ event_id: confirmationPrompt.id, user_id: user.id, response: "not_coming" }, { onConflict: "event_id,user_id" });
                setEventConfirmations(prev => [...prev.filter(c => c.user_id !== user.id), { user_id: user.id, response: "not_coming" }]);
                setConfirmationPrompt(null);
              }} style={{ width: "100%", padding: 14, borderRadius: 14, fontSize: 16, fontWeight: 700, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
                Can't make it
              </button>
            </div>
          </div>
        </div>
      )}

      {showRating && (
        <RatingModal event={showRating} user={user} isHost={showRating?.hostId === user?.id} onClose={async (rated, ratingData) => {
          if (rated) {
            await supabase.from("notifications").delete().eq("user_id", user.id).eq("type", "rate_squad").eq("data->>event_id", String(showRating.id));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (ratingData?.ratings && ratingData?.members) {
              const suggestions = ratingData.members
                .filter(m => (ratingData.ratings[m.id] || 0) >= 4 && !myBuddyIds.includes(m.id))
                .map(m => ({ id: m.id, name: m.name, rating: ratingData.ratings[m.id] }));
              if (suggestions.length > 0) setBuddySuggestions(suggestions);
            }
          }
          setShowRating(null);
        }} />
      )}

      {buddySuggestions && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#161009", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", padding: "28px 20px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>Great connections!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>You vibed well with these people — add them as buddies?</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {buddySuggestions.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{"⭐".repeat(m.rating)}</div>
                  </div>
                  <button onClick={async () => {
                    const { data } = await supabase.from("buddy_requests").insert({ requester_id: user.id, addressee_id: m.id, status: "pending" }).select().single();
                    if (data) {
                      await sendNotification(m.id, "buddy_request", `${myName} wants to be your buddy 👋`, `You met at a Gruvio event`, { requester_id: user.id });
                      setMyBuddyIds(prev => [...prev, m.id]);
                      setBuddySuggestions(prev => {
                        const next = prev.filter(s => s.id !== m.id);
                        if (next.length === 0) {
                          setToast(`Buddy request sent to ${m.name} 👋`);
                          setTimeout(() => setToast(null), 3000);
                          return null;
                        }
                        setToast(`Buddy request sent to ${m.name} 👋`);
                        setTimeout(() => setToast(null), 2500);
                        return next;
                      });
                    }
                  }} style={{ padding: "8px 14px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", border: "none", cursor: "pointer", flexShrink: 0 }}>
                    + Buddy
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setBuddySuggestions(null)} style={{ width: "100%", padding: 13, borderRadius: 14, fontSize: 15, fontWeight: 600, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "var(--bg3)", color: "#fff", border: "1px solid var(--border)", padding: "14px 24px", borderRadius: 100, fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,87,51,0.15)", animation: "fadeIn 0.3s ease", whiteSpace: "nowrap" }}>{toast}</div>
      )}

      {(screen === "explore" || screen === "create" || screen === "profile") && (
        <div className="bottom-nav">
          {[{ id: "explore", emoji: "🔍", label: "Explore" }, { id: "create", emoji: "＋", label: "Create", big: true }, { id: "profile", emoji: "👤", label: "Profile" }].map(nav => (
            <button key={nav.id} className="btn" onClick={() => { if (nav.id === "explore" && screen === "explore") { setEventsRefreshKey(k => k + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } else { navigateTo(nav.id, { step: 1 }); } }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: nav.big ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "none", border: "none", borderRadius: nav.big ? "50%" : 0, width: nav.big ? 52 : "auto", height: nav.big ? 52 : "auto", justifyContent: "center", marginTop: nav.big ? -16 : 0, boxShadow: nav.big ? "0 4px 20px rgba(255,87,51,0.45)" : "none" }}>
              <span style={{ fontSize: nav.big ? 22 : 20, color: nav.big ? "#fff" : (screen === nav.id ? "var(--accent)" : "var(--text3)") }}>{nav.emoji}</span>
              {!nav.big && <span style={{ fontSize: 11, fontWeight: 600, color: screen === nav.id ? "var(--accent)" : "var(--text3)" }}>{nav.label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ user, isMe, onBack, myName, setMyName, myUsername, setMyUsername, setMyInterests, joined, events, setEvents, selectedEvent, setSelectedEvent, blockedIds = [], onBlock, onUnblock, onReport, currentUserId, myBuddyIds = [], onBuddyChange, onNavigateProfile, onNavigateEvent }) {
  const [profileTab, setProfileTab] = useState("photos");
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [allUserEvents, setAllUserEvents] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", username: "", bio: "", location: "", instagram: "", interests: [] });
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [profilePhotoLightbox, setProfilePhotoLightbox] = useState(null);
  const profileTouchStart = useRef(0);
  const [buddyRequest, setBuddyRequest] = useState(null);
  const [buddyCount, setBuddyCount] = useState(0);
  const [buddyList, setBuddyList] = useState([]);
  const [buddyLoading, setBuddyLoading] = useState(false);
  const [showBuddyModal, setShowBuddyModal] = useState(false);
  const [showUpRate, setShowUpRate] = useState(null);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gruvio_notif_prefs') || '{}'); } catch { return {}; }
  });
  const updateNotifPref = (key, val) => {
    const updated = { ...notifPrefs, [key]: val };
    setNotifPrefs(updated);
    localStorage.setItem('gruvio_notif_prefs', JSON.stringify(updated));
  };
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
    setSaveError("");
    if (editForm.username) {
      const { data: existing } = await supabase.from("profiles").select("id").eq("username", editForm.username).neq("id", user.id).maybeSingle();
      if (existing) { setSaveError("Username already taken"); return; }
    }
    const { error } = await supabase.from("profiles").update({ full_name: editForm.full_name, username: editForm.username || null, bio: editForm.bio, location: editForm.location, instagram: editForm.instagram, interests: editForm.interests }).eq("id", user.id);
    if (error) { setSaveError("Failed to save, please try again"); return; }
    setProfile({ ...profile, ...editForm });
    if (editForm.full_name && editForm.full_name !== myName) {
      const newName = editForm.full_name;
      setMyName(newName);
      supabase.from("events").update({ host_name: newName }).eq("host_id", user.id);
      setEvents(prev => prev.map(e => {
        let updated = { ...e };
        if (e.hostId === user.id) updated.host = newName;
        const idx = (e.members || []).indexOf(user.id);
        if (idx !== -1) {
          const updatedNames = [...(e.memberNames || [])];
          updatedNames[idx] = newName;
          updated.memberNames = updatedNames;
        }
        return updated;
      }));
      setSelectedEvent(prev => {
        if (!prev) return prev;
        let updated = { ...prev };
        if (prev.hostId === user.id) updated.host = newName;
        const idx = (prev.members || []).indexOf(user.id);
        if (idx !== -1) {
          const updatedNames = [...(prev.memberNames || [])];
          updatedNames[idx] = newName;
          updated.memberNames = updatedNames;
        }
        return updated;
      });
    }
    if (editForm.username) setMyUsername(editForm.username);
    setMyInterests(editForm.interests);
    setEditing(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          setEditForm({ full_name: data.full_name || "", username: data.username || "", bio: data.bio || "", location: data.location || "", instagram: data.instagram || "", interests: data.interests || [] });
        }
      });
    supabase.from("events").select("*").order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAllUserEvents(data.map(e => ({ ...e, groupSize: e.group_size, maxSize: e.max_size, host: e.host_name, hostId: e.host_id, members: e.members || [], memberNames: e.member_names || [] })));
      });
    supabase.from("event_photos").select("*").eq("user_id", user.id).eq("show_on_profile", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProfilePhotos(data); });
    // Buddy count via RPC (works correctly for any profile)
    supabase.rpc("get_buddy_count", { p_user_id: user.id })
      .then(({ data }) => setBuddyCount(data || 0));
    // Buddy list via RPC (works correctly for any profile)
    supabase.rpc("get_user_buddies", { p_user_id: user.id })
      .then(({ data }) => setBuddyList(data || []));
    // Show-up rate from attendance table
    supabase.from("attendance").select("showed_up").eq("user_id", user.id)
      .then(({ data }) => {
        if (data?.length > 0) setShowUpRate(Math.round(data.filter(r => r.showed_up).length / data.length * 100));
        else setShowUpRate(null);
      });
    // Buddy request status (when viewing someone else)
    if (!isMe && currentUserId) {
      supabase.from("buddy_requests").select("*")
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${user.id}),and(requester_id.eq.${user.id},addressee_id.eq.${currentUserId})`)
        .maybeSingle()
        .then(({ data }) => setBuddyRequest(data || null));
    }
  }, [user?.id]);

  const buddyStatus = !buddyRequest ? null
    : buddyRequest.status === "accepted" ? "accepted"
    : buddyRequest.requester_id === currentUserId ? "pending_sent" : "pending_received";

  const sendBuddyRequest = async () => {
    setBuddyLoading(true);
    const { data } = await supabase.from("buddy_requests").insert({ requester_id: currentUserId, addressee_id: user.id, status: "pending" }).select().single();
    setBuddyRequest(data);
    await sendNotification(user.id, "buddy_request", `${myName} wants to be your buddy 👋`, `Tap to accept or decline`, { requester_id: currentUserId });
    setBuddyLoading(false);
  };
  const cancelBuddyRequest = async () => {
    await supabase.from("buddy_requests").delete().eq("id", buddyRequest.id);
    setBuddyRequest(null);
  };
  const acceptBuddyRequest = async () => {
    setBuddyLoading(true);
    await supabase.from("buddy_requests").update({ status: "accepted" }).eq("id", buddyRequest.id);
    setBuddyRequest({ ...buddyRequest, status: "accepted" });
    setBuddyCount(c => c + 1);
    onBuddyChange(user.id, true);
    await sendNotification(buddyRequest.requester_id, "buddy_accepted", `${myName} accepted your buddy request 🎉`, `You two are now buddies`, { buddy_id: currentUserId });
    setBuddyLoading(false);
  };
  const declineBuddyRequest = async () => {
    await supabase.from("buddy_requests").delete().eq("id", buddyRequest.id);
    setBuddyRequest(null);
  };
  const removeBuddy = async () => {
    if (!window.confirm(`Remove ${displayName} from your buddies?`)) return;
    await supabase.from("buddy_requests").delete().eq("id", buddyRequest.id);
    setBuddyRequest(null);
    setBuddyCount(c => Math.max(0, c - 1));
    onBuddyChange(user.id, false);
  };

  const displayName = isMe ? myName : (profile?.full_name || user?.name || "");
  const displayUsername = isMe ? (myUsername || (myName ? myName.toLowerCase().replace(/\s+/g, "") : "you")) : (profile?.username || profile?.full_name?.toLowerCase().replace(/\s+/g, "") || "");

  return (
    <>
    <div className="fade-in" style={{ width: "100%", maxWidth: 480, margin: "0 auto", paddingBottom: "calc(100px + env(safe-area-inset-bottom))", background: "var(--bg)", minHeight: "100vh" }}>
      <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a0800, #2d1200)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,87,51,0.08), rgba(255,140,66,0.04))" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,87,51,0.15), transparent)" }} />
        {!isMe && (
          <>
            <div style={{ position: "absolute", top: 16, left: 16 }}>
              <button className="btn" onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>← Back</button>
            </div>
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
              {blockedIds.includes(user?.id) ? (
                <button className="btn" onClick={async () => {
                  await supabase.from("blocks").delete().eq("blocker_id", (await supabase.auth.getUser()).data.user?.id).eq("blocked_id", user.id);
                  onUnblock(user.id);
                }} style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", cursor: "pointer" }}>Unblock</button>
              ) : (
                <button className="btn" onClick={async () => {
                  if (!window.confirm(`Block ${displayName}? You won't see their events or profile.`)) return;
                  const { data: { user: me } } = await supabase.auth.getUser();
                  await supabase.from("blocks").insert({ blocker_id: me.id, blocked_id: user.id });
                  onBlock(user.id);
                  onBack();
                }} style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "rgba(255,100,100,0.9)", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(239,68,68,0.2)", backdropFilter: "blur(10px)", cursor: "pointer" }}>Block</button>
              )}
              <button className="btn" onClick={() => onReport(user.id)} style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", cursor: "pointer" }}>Report</button>
            </div>
          </>
        )}
        {isMe && !editing && (
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
            <div onClick={() => setEditing(true)} style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.12s, opacity 0.12s" }} onMouseDown={e => e.currentTarget.style.transform="scale(0.92)"} onMouseUp={e => e.currentTarget.style.transform="scale(1)"} onTouchStart={e => e.currentTarget.style.transform="scale(0.92)"} onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}>Edit</div>
            <div onClick={() => setShowSettings(true)} style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.12s, opacity 0.12s" }} onMouseDown={e => e.currentTarget.style.transform="scale(0.92)"} onMouseUp={e => e.currentTarget.style.transform="scale(1)"} onTouchStart={e => e.currentTarget.style.transform="scale(0.92)"} onTouchEnd={e => e.currentTarget.style.transform="scale(1)"}>⚙️</div>
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
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 15 }}>@</span>
              <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) })} placeholder="username" style={{ paddingLeft: 28 }} />
            </div>
            <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Write a short bio..." rows={3} style={{ resize: "none" }} />
            <div style={{ position: "relative" }}>
              {showCityPicker && (
                <div onClick={() => setShowCityPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
              )}
              <button type="button" onClick={() => setShowCityPicker(v => !v)} style={{
                width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,120,60,0.12)",
                background: "#1a1510", color: editForm.location ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                fontSize: 15, fontFamily: "inherit", textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "border 0.2s",
              }}>
                <span>{editForm.location || "Select your city"}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>{showCityPicker ? "▲" : "▼"}</span>
              </button>
              {showCityPicker && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
                  background: "#1a1510", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.6)", maxHeight: 240, overflowY: "auto",
                }}>
                  {BG_CITIES.map((c, i) => (
                    <div key={c} onMouseDown={() => { setEditForm(f => ({ ...f, location: c })); setShowCityPicker(false); }} style={{
                      padding: "11px 16px", fontSize: 14, cursor: "pointer",
                      color: editForm.location === c ? "var(--accent)" : "rgba(255,255,255,0.8)",
                      fontWeight: editForm.location === c ? 700 : 400,
                      background: editForm.location === c ? "rgba(255,87,51,0.08)" : "transparent",
                      borderBottom: i < BG_CITIES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      transition: "background 0.12s",
                    }}
                      onMouseEnter={e => { if (editForm.location !== c) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = editForm.location === c ? "rgba(255,87,51,0.08)" : "transparent"; }}
                    >
                      {editForm.location === c ? "✓ " : ""}{c}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input value={editForm.instagram} onChange={e => setEditForm({ ...editForm, instagram: e.target.value.replace("@", "") })} placeholder="Instagram username (without @)" />
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>INTERESTS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[{ label: "Nightlife", emoji: "🪩" }, { label: "Sports", emoji: "🏃" }, { label: "Outdoors", emoji: "🌿" }, { label: "Beach", emoji: "🏖️" }, { label: "Food & Drink", emoji: "🍽️" }, { label: "Culture", emoji: "🎨" }, { label: "Wellness", emoji: "🧘" }, { label: "Travel", emoji: "🚗" }].map(cat => {
                  const selected = editForm.interests.includes(cat.label);
                  return (
                    <button key={cat.label} onClick={() => setEditForm({ ...editForm, interests: selected ? editForm.interests.filter(i => i !== cat.label) : [...editForm.interests, cat.label] })} style={{ padding: "7px 13px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", border: selected ? "1.5px solid var(--accent)" : "1.5px solid var(--border2)", background: selected ? "rgba(255,87,51,0.15)" : "var(--bg3)", color: selected ? "var(--accent)" : "var(--text2)", transition: "all 0.15s" }}>{cat.emoji} {cat.label}</button>
                  );
                })}
              </div>
            </div>
            {saveError && <div style={{ fontSize: 13, color: "#f87171", textAlign: "center", marginBottom: 8 }}>{saveError}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={saveProfile} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", border: "none" }}>Save</button>
              <button className="btn" onClick={() => { setEditing(false); setSaveError(""); }} style={{ flex: 1, padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--bg3)", color: "var(--text2)", border: "1px solid var(--border2)" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, color: "#fff" }}>{profile?.full_name || displayName}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <p style={{ color: "var(--text3)", fontSize: 13, margin: 0 }}>@{displayUsername}</p>
              {(() => {
                const attended = profile?.events_attended || 0;
                const level = attended >= 30 ? { icon: "👑", name: "Legend" } : attended >= 15 ? { icon: "🔥", name: "Regular" } : attended >= 5 ? { icon: "⚡", name: "Active" } : { icon: "🌱", name: "New" };
                const tiers = [
                  { icon: "🌱", name: "New", min: 0, desc: "First steps. Explore what's happening around you." },
                  { icon: "⚡", name: "Active", min: 5, desc: "You're in the game. People are starting to recognise you." },
                  { icon: "🔥", name: "Regular", min: 15, desc: "A familiar face. Hosts love seeing you on the list." },
                  { icon: "👑", name: "Legend", min: 30, desc: "You are the scene. Events feel different when you're there." },
                ];
                return (
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 9px", borderRadius: 100, background: "rgba(255,87,51,0.12)", border: "1px solid rgba(255,87,51,0.25)", color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
                      {level.icon} {level.name}
                    </span>
                    <button onClick={() => setShowLevelInfo(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "0 2px", lineHeight: 1 }}>ⓘ</button>
                    {showLevelInfo && (
                      <>
                        <div onClick={() => setShowLevelInfo(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50, background: "#1a1510", border: "1px solid rgba(255,87,51,0.25)", borderRadius: 12, padding: "12px 14px", width: 240, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reputation levels</div>
                          {tiers.map(t => {
                            const isCurrent = t.name === level.name;
                            return (
                              <div key={t.name} style={{ display: "flex", gap: 10, marginBottom: 10, opacity: isCurrent ? 1 : 0.4 }}>
                                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "var(--accent)" : "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>{t.name}{isCurrent ? " · you" : ""}</div>
                                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4, marginTop: 2 }}>{t.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                            {level.name === "Legend" ? "You've reached the top." : `${tiers[tiers.findIndex(t => t.name === level.name) + 1].min - attended} more events to ${tiers[tiers.findIndex(t => t.name === level.name) + 1].name}`}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
            {profile?.bio && <p style={{ fontSize: 14, color: "var(--text2)", marginTop: 8, lineHeight: 1.6 }}>{profile.bio}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              {profile?.location && <span style={{ fontSize: 12, color: "var(--text3)" }}>📍 {profile.location}</span>}
                {profile?.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--text3)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                  @{profile.instagram}
                </a>
              )}
            </div>
            {profile?.interests?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                {profile.interests.map(interest => {
                  const cat = [{ label: "Nightlife", emoji: "🪩" }, { label: "Sports", emoji: "🏃" }, { label: "Outdoors", emoji: "🌿" }, { label: "Beach", emoji: "🏖️" }, { label: "Food & Drink", emoji: "🍽️" }, { label: "Culture", emoji: "🎨" }, { label: "Wellness", emoji: "🧘" }, { label: "Travel", emoji: "🚗" }].find(c => c.label === interest);
                  return (
                    <span key={interest} style={{ padding: "5px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: "rgba(255,87,51,0.1)", color: "var(--accent)", border: "1px solid rgba(255,87,51,0.2)" }}>
                      {cat?.emoji} {interest}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          {[
            { icon: "🎪", val: profile?.events_attended || 0, label: "Attended" },
            { icon: "🎤", val: profile?.events_hosted || 0, label: "Hosted" },
            { icon: "✅", val: showUpRate !== null ? `${showUpRate}%` : "—", label: "Show-up" },
            { icon: "⭐", val: profile?.total_ratings > 0 ? Number(profile.avg_rating).toFixed(1) : "—", label: profile?.total_ratings > 0 ? `${profile.total_ratings} ratings` : "Rating" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "var(--bg3)", borderRadius: 14, border: "1px solid var(--border2)", padding: "11px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{stat.icon}</span>
              <div>
                <div className="display" style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.5, lineHeight: 1 }}>{stat.val}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.7 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div onClick={buddyCount > 0 ? () => setShowBuddyModal(true) : undefined} onMouseDown={buddyCount > 0 ? e => e.currentTarget.style.transform="scale(0.97)" : undefined} onMouseUp={buddyCount > 0 ? e => e.currentTarget.style.transform="scale(1)" : undefined} onTouchStart={buddyCount > 0 ? e => e.currentTarget.style.transform="scale(0.97)" : undefined} onTouchEnd={buddyCount > 0 ? e => e.currentTarget.style.transform="scale(1)" : undefined} style={{ marginTop: 10, background: "var(--bg3)", borderRadius: 16, border: "1px solid var(--border2)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: buddyCount > 0 ? "pointer" : "default", transition: "transform 0.12s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>👥</span>
            <div>
              <div className="display" style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>{buddyCount} {buddyCount === 1 ? "Buddy" : "Buddies"}</div>
            </div>
          </div>
          {buddyCount > 0 && <span style={{ fontSize: 13, color: "var(--text3)" }}>View →</span>}
        </div>

        {/* Buddy list modal */}
        {showBuddyModal && (
          <div className="frame-overlay" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={() => setShowBuddyModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg2)", borderRadius: "24px 24px 0 0", padding: "0 0 32px", maxHeight: "75vh", display: "flex", flexDirection: "column", border: "1px solid var(--border2)", borderBottom: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px" }}>
                <h3 className="display" style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>👥 Buddies · {buddyCount}</h3>
                <button onClick={() => setShowBuddyModal(false)} style={{ background: "var(--bg3)", border: "none", color: "var(--text2)", width: 32, height: 32, borderRadius: "50%", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
              <div style={{ overflowY: "auto", padding: "0 16px" }}>
                {buddyList.map(b => (
                  <div key={b.id} onClick={() => { setShowBuddyModal(false); onNavigateProfile({ id: b.id, name: b.full_name }); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border2)", cursor: "pointer" }}>
                    <div className="avatar-ring" style={{ width: 44, height: 44, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontSize: 16, fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                      {b.avatar_url ? <img src={b.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (b.full_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{b.full_name}</div>
                      {b.location && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>📍 {b.location}</div>}
                    </div>
                    <span style={{ fontSize: 13, color: "var(--text3)" }}>→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Buddy button (non-me only) */}
        {!isMe && (
          <div style={{ marginTop: 16 }}>
            {buddyStatus === null && (
              <button className="btn" onClick={sendBuddyRequest} disabled={buddyLoading} style={{ width: "100%", padding: "13px 0", borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", border: "none", boxShadow: "0 6px 20px rgba(255,87,51,0.3)" }}>
                {buddyLoading ? "Sending..." : "👋 Add Buddy"}
              </button>
            )}
            {buddyStatus === "pending_sent" && (
              <button className="btn" onClick={cancelBuddyRequest} style={{ width: "100%", padding: "13px 0", borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)" }}>
                ⏳ Request Sent · Cancel
              </button>
            )}
            {buddyStatus === "pending_received" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={acceptBuddyRequest} disabled={buddyLoading} style={{ flex: 1, padding: "13px 0", borderRadius: 14, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none" }}>
                  {buddyLoading ? "..." : "✓ Accept"}
                </button>
                <button className="btn" onClick={declineBuddyRequest} style={{ flex: 1, padding: "13px 0", borderRadius: 14, fontSize: 15, fontWeight: 700, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)" }}>
                  Decline
                </button>
              </div>
            )}
            {buddyStatus === "accepted" && (
              <button className="btn" onClick={removeBuddy} style={{ width: "100%", padding: "13px 0", borderRadius: 14, fontSize: 15, fontWeight: 700, background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                ✓ Buddies · Remove
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", marginTop: 22, background: "var(--bg3)", borderRadius: 12, padding: 4, gap: 4 }}>
          {[["photos", "📸 Photos"], ["history", "📅 History"]].map(([id, label]) => (
            <button key={id} className="btn" onClick={() => setProfileTab(id)} style={{
              flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 700, border: "none",
              background: profileTab === id ? "var(--card)" : "transparent",
              color: profileTab === id ? "#fff" : "var(--text3)",
              boxShadow: profileTab === id ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              transition: "all 0.18s",
            }}>{label}</button>
          ))}
        </div>

        {/* Photos tab */}
        {profileTab === "photos" && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            {profilePhotos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
                <p style={{ fontWeight: 600, color: "var(--text2)" }}>No photos yet</p>
                <p style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                  {isMe ? "Bookmark 🔖 photos from your squad albums to feature them here" : "No photos featured yet"}
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, borderRadius: 12, overflow: "hidden" }}>
                {profilePhotos.map((p, i) => (
                  <div key={p.id} onClick={() => setProfilePhotoLightbox(i)} style={{ aspectRatio: "1", overflow: "hidden", cursor: "pointer", background: "var(--bg3)" }}>
                    <img src={p.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s" }} />
                  </div>
                ))}
              </div>
            )}
            {profilePhotoLightbox !== null && profilePhotos[profilePhotoLightbox] && (() => {
              const ph = profilePhotos[profilePhotoLightbox];
              const isFirst = profilePhotoLightbox === 0;
              const isLast = profilePhotoLightbox === profilePhotos.length - 1;
              return (
                <div className="frame-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                  onTouchStart={(e) => { profileTouchStart.current = e.touches[0].clientX; }}
                  onTouchEnd={(e) => {
                    const diff = profileTouchStart.current - e.changedTouches[0].clientX;
                    if (diff > 50 && !isLast) setProfilePhotoLightbox(profilePhotoLightbox + 1);
                    else if (diff < -50 && !isFirst) setProfilePhotoLightbox(profilePhotoLightbox - 1);
                  }}
                >
                  <button onClick={() => setProfilePhotoLightbox(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  <div style={{ position: "absolute", top: 26, left: "50%", transform: "translateX(-50%)", fontSize: 13, color: "var(--text3)", fontWeight: 600 }}>{profilePhotoLightbox + 1} / {profilePhotos.length}</div>
                  <img src={ph.photo_url} alt="" style={{ maxWidth: "100%", maxHeight: "72vh", objectFit: "contain", padding: "0 16px", borderRadius: 12 }} />
                  {(ph.event_emoji || ph.event_title) && (
                    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100, padding: "6px 14px" }}>
                      {ph.event_emoji && <span style={{ fontSize: 16 }}>{ph.event_emoji}</span>}
                      {ph.event_title && <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{ph.event_title}</span>}
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
                    <button onClick={() => setProfilePhotoLightbox(profilePhotoLightbox - 1)} disabled={isFirst} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: isFirst ? "rgba(255,255,255,0.2)" : "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 24, cursor: isFirst ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                    {isMe && (
                      <button onClick={async () => {
                        await supabase.from("event_photos").update({ show_on_profile: false }).eq("id", ph.id);
                        setProfilePhotos(prev => prev.filter(x => x.id !== ph.id));
                        if (isLast && profilePhotoLightbox > 0) setProfilePhotoLightbox(profilePhotoLightbox - 1);
                        else if (profilePhotos.length === 1) setProfilePhotoLightbox(null);
                      }} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 100, padding: "7px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                    )}
                    <button onClick={() => setProfilePhotoLightbox(profilePhotoLightbox + 1)} disabled={isLast} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: isLast ? "rgba(255,255,255,0.2)" : "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 24, cursor: isLast ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* History tab — upcoming + past */}
        {profileTab === "history" && (() => {
          const now = new Date();
          const allEvents = [
            ...myEvents.map(e => ({ ...e, role: "hosted" })),
            ...joinedEvents.map(e => ({ ...e, role: "joined" })),
          ].sort((a, b) => new Date(b.time) - new Date(a.time));
          const getEndTime = (e) => e.endTime ? new Date(e.endTime) : (e.time && e.time !== "TBD" ? new Date(e.time) : null);
          const upcomingEvents = allEvents.filter(e => { const et = getEndTime(e); return et ? et >= now : true; });
          const pastEvents = allEvents.filter(e => { const et = getEndTime(e); return et ? et < now : false; });

          const EventRow = ({ e }) => (
            <div className="card shadow-sm btn" onClick={() => onNavigateEvent && onNavigateEvent(e)} style={{ padding: 14, marginBottom: 10, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, fontSize: 21, display: "flex", alignItems: "center", justifyContent: "center", background: `${e.color || "var(--accent)"}18`, border: `1px solid ${e.color || "var(--accent)"}25`, flexShrink: 0 }}>{e.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{e.time && e.time !== "TBD" ? new Date(e.time).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBD"} · {e.groupSize} people</div>
              </div>
              <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "3px 10px", background: e.role === "hosted" ? "rgba(255,87,51,0.12)" : "rgba(16,185,129,0.1)", color: e.role === "hosted" ? "var(--accent)" : "#10b981", border: `1px solid ${e.role === "hosted" ? "rgba(255,87,51,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                {e.role === "hosted" ? "Hosted" : "Joined"}
              </span>
            </div>
          );

          if (allEvents.length === 0) return (
            <div className="fade-in" style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <p style={{ fontWeight: 600, color: "var(--text2)" }}>No events yet</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Events you host or join will appear here</p>
            </div>
          );

          return (
            <div className="fade-in" style={{ marginTop: 16 }}>
              {upcomingEvents.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Upcoming</div>
                  {upcomingEvents.map((e, i) => <EventRow key={i} e={e} />)}
                </>
              )}
              {pastEvents.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, marginTop: upcomingEvents.length > 0 ? 20 : 0 }}>Past</div>
                  {pastEvents.map((e, i) => <EventRow key={i} e={e} />)}
                </>
              )}
            </div>
          );
        })()}

        {/* Buddies tab — my profile only */}
        {profileTab === "buddies" && (
          <div className="fade-in" style={{ marginTop: 16 }}>
            {buddyList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                <p style={{ fontWeight: 600, color: "var(--text2)" }}>No buddies yet</p>
                <p style={{ fontSize: 13, marginTop: 4 }}>Add people you meet at events as buddies</p>
              </div>
            ) : buddyList.map(b => (
              <div key={b.id} className="card shadow-sm" style={{ padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <div className="avatar-ring" style={{ width: 44, height: 44, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", fontSize: 16, fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                  {b.avatar_url ? <img src={b.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (b.full_name?.[0] || "?").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{b.full_name}</div>
                  {b.location && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>📍 {b.location}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Settings Sheet */}
    {showSettings && isMe && (
      <div onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#161009", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", padding: "20px 20px calc(32px + env(safe-area-inset-bottom))", maxHeight: "85vh", overflowY: "auto" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 24px" }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 24 }}>Settings</div>

          {/* Notifications */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Notifications</div>
          {[
            { key: "new_events", label: "New events matching interests", icon: "🎉" },
            { key: "buddy_requests", label: "Buddy requests", icon: "👋" },
            { key: "join_requests", label: "Join requests to my events", icon: "📋" },
            { key: "weekend_digest", label: "Weekend event digest", icon: "📅" },
          ].map(({ key, label, icon }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{label}</span>
              </div>
              <div onClick={() => updateNotifPref(key, notifPrefs[key] === false ? true : false)}
                style={{ width: 44, height: 26, borderRadius: 13, background: notifPrefs[key] === false ? "rgba(255,255,255,0.1)" : "var(--accent)", transition: "background 0.2s", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: notifPrefs[key] === false ? 3 : 21, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
              </div>
            </div>
          ))}

          {/* Legal */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase", margin: "24px 0 12px" }}>Legal</div>
          {[
            { label: "Privacy Policy", url: "https://gruvio.app/privacy" },
            { label: "Terms of Service", url: "https://gruvio.app/terms" },
          ].map(({ label, url }) => (
            <div key={label} onClick={() => window.open(url, window.Capacitor ? "_system" : "_blank")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{label}</span>
              <span style={{ fontSize: 14, color: "var(--text3)" }}>›</span>
            </div>
          ))}

          {/* About */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase", margin: "24px 0 12px" }}>About</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>Version</span>
            <span style={{ fontSize: 14, color: "var(--text3)" }}>1.0.0</span>
          </div>

          {/* Account */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase", margin: "24px 0 12px" }}>Account</div>
          <div onClick={async () => { setShowSettings(false); await supabase.auth.signOut(); }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>Log Out</span>
          </div>
          <div onClick={() => { setShowSettings(false); setTimeout(() => setShowDeleteConfirm(true), 200); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>🗑️</span>
            <span style={{ fontSize: 14, color: "#ef4444" }}>Delete Account</span>
          </div>
        </div>
      </div>
    )}

    {/* Delete Account Confirmation */}
    {showDeleteConfirm && isMe && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ width: "100%", maxWidth: 400, background: "#1a0d05", borderRadius: 24, border: "1px solid rgba(239,68,68,0.25)", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Delete Account</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 28 }}>This will permanently delete your profile, events, messages, and all data. <span style={{ color: "rgba(239,68,68,0.8)", fontWeight: 600 }}>This cannot be undone.</span></div>
          <button disabled={deleting} onClick={async () => {
            setDeleting(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const r = await fetch("https://gruvio.app/api/delete-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: session?.access_token }),
              });
              if (!r.ok) throw new Error("Server error");
              await supabase.auth.signOut();
            } catch (e) {
              setDeleting(false);
              setShowDeleteConfirm(false);
              alert("Something went wrong. Please contact support@gruvio.app");
            }
          }} style={{ width: "100%", padding: "14px", borderRadius: 14, background: deleting ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.85)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: deleting ? "default" : "pointer", marginBottom: 12, transition: "background 0.2s" }}>
            {deleting ? "Deleting..." : "Yes, delete my account"}
          </button>
          <button onClick={() => setShowDeleteConfirm(false)} style={{ width: "100%", padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    )}
    </>
  );
}