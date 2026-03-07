import { useState, useEffect, useRef } from "react";

export default function LocationInput({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=bg&accept-language=en`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (e) { console.error(e); }
    }, 400);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder || "Search for a location"}
        style={{
          width: "100%", background: "#faf9f7", border: "1.5px solid #e8e3db",
          color: "#1a1209", borderRadius: "12px", padding: "12px 16px",
          fontSize: "15px", outline: "none", fontFamily: "'DM Sans', sans-serif",
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000,
          background: "#fff", borderRadius: 12, marginTop: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: "1px solid #e8e3db",
          overflow: "hidden",
        }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => {
              const name = s.display_name.split(",").slice(0, 3).join(",");
              setQuery(name);
              onChange(name);
              setShowSuggestions(false);
              setSuggestions([]);
            }} style={{
              padding: "12px 16px", fontSize: 14, cursor: "pointer",
              borderBottom: i < suggestions.length - 1 ? "1px solid #f0ece5" : "none",
              color: "#1a1209", lineHeight: 1.4,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8f5f0"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              📍 {s.display_name.split(",").slice(0, 3).join(",")}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}