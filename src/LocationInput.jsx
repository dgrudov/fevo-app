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

function getService() {
  if (window.google?.maps?.places) {
    return new window.google.maps.places.AutocompleteService();
  }
  return null;
}

export default function LocationInput({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValid, setIsValid] = useState(!!value);
  const debounceRef = useRef(null);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const service = getService();
      if (!service) return;
      service.getPlacePredictions(
        { input: query, types: ["establishment", "geocode"], componentRestrictions: { country: "bg" } },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length) {
            setSuggestions(results);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const selectPlace = (s) => {
    const name = s.structured_formatting?.main_text
      ? `${s.structured_formatting.main_text}${s.structured_formatting.secondary_text ? `, ${s.structured_formatting.secondary_text}` : ""}`
      : s.description;
    justSelectedRef.current = true;
    setQuery(name);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsValid(true);
    onChange(name);
  };

  const handleChange = (e) => {
    justSelectedRef.current = false;
    setQuery(e.target.value);
    setIsValid(false);
    onChange("");
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => { if (suggestions.length > 0 && !isValid) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder || "Search for a place"}
          style={{ paddingRight: isValid ? 36 : undefined }}
        />
        {isValid && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#10b981", fontSize: 16, pointerEvents: "none" }}>✓</div>
        )}
      </div>
      {!isValid && query.length > 1 && !showSuggestions && (
        <div style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", marginTop: 4, paddingLeft: 2 }}>Select a location from the list</div>
      )}
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
              <div key={s.place_id} onMouseDown={() => selectPlace(s)} style={{
                padding: "11px 16px", fontSize: 14, cursor: "pointer",
                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                color: "rgba(255,255,255,0.85)", lineHeight: 1.4, transition: "background 0.15s",
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
