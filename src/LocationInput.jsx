import { useState, useEffect, useRef } from "react";

const placeTypeIcon = (types = []) => {
  if (types.includes("bar") || types.includes("night_club")) return "🍺";
  if (types.includes("restaurant") || types.includes("food")) return "🍽️";
  if (types.includes("cafe")) return "☕";
  if (types.includes("gym") || types.includes("fitness")) return "🏋️";
  if (types.includes("park")) return "🌿";
  if (types.includes("stadium") || types.includes("sports_complex")) return "🏟️";
  if (types.includes("beach")) return "🏖️";
  if (types.includes("shopping_mall") || types.includes("store")) return "🛍️";
  if (types.includes("lodging") || types.includes("hotel")) return "🏨";
  return "📍";
};

export default function LocationInput({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const serviceRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const initService = () => {
      if (window.google?.maps?.places) {
        serviceRef.current = new window.google.maps.places.AutocompleteService();
      }
    };
    if (window.google?.maps?.places) {
      initService();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) { initService(); clearInterval(interval); }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!serviceRef.current) return;
      serviceRef.current.getPlacePredictions(
        { input: query, types: ["establishment", "geocode"] },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setSuggestions(results);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder || "Search for a place"}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000,
          background: "#1a1510", borderRadius: 12, marginTop: 4,
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}>
          {suggestions.map((s, i) => {
            const icon = placeTypeIcon(s.types || []);
            const main = s.structured_formatting?.main_text || s.description;
            const secondary = s.structured_formatting?.secondary_text || "";
            return (
              <div key={s.place_id} onMouseDown={() => {
                const name = s.structured_formatting?.main_text
                  ? `${s.structured_formatting.main_text}${secondary ? `, ${secondary}` : ""}`
                  : s.description;
                setQuery(name);
                onChange(name);
                setTimeout(() => { setShowSuggestions(false); setSuggestions([]); }, 100);
              }} style={{
                padding: "11px 16px", fontSize: 14, cursor: "pointer",
                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                color: "rgba(255,255,255,0.85)", lineHeight: 1.4,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,87,51,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{main}</div>
                    {secondary && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{secondary}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
