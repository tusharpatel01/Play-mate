import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";
import { loadGoogleMaps } from "../common/MatchMap";
import { useDebounce } from "../../hooks";

/**
 * Google Places autocomplete with dropdown suggestions.
 * Returns { lat, lng, address, city, groundName } via onSelect.
 */
export default function PlacesAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search for a venue or address...",
  required = false,
}) {
  const [input, setInput] = useState(value);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const debouncedInput = useDebounce(input, 300);

  const autocompleteRef = useRef(null);
  const placesRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const wrapperRef = useRef(null);

  // ─── Load Google Maps API once ─────────────────────
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError("Add VITE_GOOGLE_MAPS_KEY to .env to enable location search");
      return;
    }
    loadGoogleMaps(apiKey)
      .then((google) => {
        autocompleteRef.current = new google.maps.places.AutocompleteService();
        // Places service needs a fake DOM element to render legal disclaimers
        const div = document.createElement("div");
        placesRef.current = new google.maps.places.PlacesService(div);
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      })
      .catch((err) => setError(err.message));
  }, []);

  // ─── Fetch predictions when typing ─────────────────
  useEffect(() => {
    if (!autocompleteRef.current || !debouncedInput || debouncedInput.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    autocompleteRef.current.getPlacePredictions(
      {
        input: debouncedInput,
        sessionToken: sessionTokenRef.current,
        // Bias toward sports / venues — but allow any address
        types: ["establishment", "geocode"],
      },
      (results, status) => {
        setLoading(false);
        if (status === "OK" && results) {
          setPredictions(results.slice(0, 5));
          setOpen(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, [debouncedInput]);

  // ─── Click outside to close ─────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Pick a prediction → fetch full details ────────
  const handlePick = useCallback(
    (prediction) => {
      if (!placesRef.current) return;
      setLoading(true);

      placesRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["geometry", "formatted_address", "name", "address_components"],
          sessionToken: sessionTokenRef.current,
        },
        (place, status) => {
          setLoading(false);
          if (status !== "OK" || !place?.geometry) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address;
          const groundName = place.name && place.name !== address ? place.name : "";

          // Try to extract city from address components
          const cityComp = place.address_components?.find((c) =>
            c.types.some((t) =>
              ["locality", "administrative_area_level_2", "postal_town"].includes(t)
            )
          );
          const city = cityComp?.long_name || "";

          // Refresh session token after selection
          if (window.google?.maps?.places) {
            sessionTokenRef.current =
              new window.google.maps.places.AutocompleteSessionToken();
          }

          setInput(address);
          setOpen(false);
          setPredictions([]);
          onChange?.(address);
          onSelect?.({ lat, lng, address, city, groundName });
        }
      );
    },
    [onChange, onSelect]
  );

  const handleClear = () => {
    setInput("");
    setPredictions([]);
    setOpen(false);
    onChange?.("");
    onSelect?.(null);
  };

  if (error) {
    return (
      <div className="space-y-1.5">
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); onChange?.(e.target.value); }}
          placeholder="Type address manually (Maps disabled)"
          className="input"
          required={required}
        />
        <p className="text-xs text-yellow-500/80 flex items-center gap-1">
          <MapPin size={11} /> {error}
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          onChange?.(e.target.value);
          if (e.target.value.length >= 3) setOpen(true);
        }}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className="input pl-9 pr-9"
        required={required}
        autoComplete="off"
      />
      {loading ? (
        <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />
      ) : input ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          <X size={14} />
        </button>
      ) : null}

      {/* Dropdown */}
      {open && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 card overflow-hidden z-50 shadow-2xl">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => handlePick(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-white/[0.04] last:border-b-0 transition-colors group"
            >
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-brand-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {p.structured_formatting?.main_text || p.description}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {p.structured_formatting?.secondary_text || ""}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
