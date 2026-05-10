import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

// ─── Load Google Maps script once ─────────────────────────
let mapsScriptPromise = null;

export const loadGoogleMaps = (apiKey) => {
  if (mapsScriptPromise) return mapsScriptPromise;
  if (window.google?.maps) return Promise.resolve(window.google);

  mapsScriptPromise = new Promise((resolve, reject) => {
    if (!apiKey) {
      reject(new Error("VITE_GOOGLE_MAPS_KEY missing in .env"));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return mapsScriptPromise;
};

// ─── Dark theme styles for the map ───────────────────────
const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2e1a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1628" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3b5e7a" }] },
];

// ─── Single location map (used in MatchDetail) ───────────
export function MatchMap({ lat, lng, address, height = 280 }) {
  const mapRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lng) return;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      setError("Map disabled — add VITE_GOOGLE_MAPS_KEY to .env");
      setLoading(false);
      return;
    }

    loadGoogleMaps(apiKey)
      .then((google) => {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 15,
          styles: DARK_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });
        new google.maps.Marker({
          position: { lat, lng },
          map,
          title: address,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#4ade80",
            fillOpacity: 0.9,
            strokeColor: "#0d1117",
            strokeWeight: 3,
          },
        });
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [lat, lng, address]);

  if (error) {
    return (
      <div
        className="card flex flex-col items-center justify-center text-center p-6"
        style={{ height }}
      >
        <MapPin size={28} className="text-slate-600 mb-2" />
        <p className="text-sm text-slate-500 mb-1">{error}</p>
        {address && <p className="text-xs text-slate-600">{address}</p>}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden relative" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-dark-850/80 flex items-center justify-center z-10">
          <Loader2 size={20} className="animate-spin text-brand-400" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

// ─── Multi-marker map (Explore page) ─────────────────────
export function MatchesMap({ matches = [], userLocation, height = 380, onMarkerClick }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef([]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError("Map disabled — add VITE_GOOGLE_MAPS_KEY to .env");
      setLoading(false);
      return;
    }

    loadGoogleMaps(apiKey)
      .then((google) => {
        const center = userLocation || { lat: 28.6139, lng: 77.2090 };
        const m = new google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          styles: DARK_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
        });
        setMap(m);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [userLocation]);

  // ─── Draw markers when matches change ────────────────
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    matches.forEach((match) => {
      const [lng, lat] = match.location?.coordinates || [];
      if (!lat || !lng) return;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: match.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: match.status === "open" ? "#4ade80" : "#ef4444",
          fillOpacity: 0.9,
          strokeColor: "#0d1117",
          strokeWeight: 2,
        },
      });

      const info = new window.google.maps.InfoWindow({
        content: `
          <div style="background:#0d1117;color:#e2e8f0;padding:8px;border-radius:8px;font-family:Inter,sans-serif;min-width:160px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${match.title}</div>
            <div style="font-size:11px;color:#64748b;text-transform:capitalize;">${match.sport}</div>
            <div style="font-size:11px;color:${match.status === "open" ? "#4ade80" : "#ef4444"};margin-top:4px;">
              ${match.totalSlots - (match.participants?.length || 0)} spots left
            </div>
          </div>`,
      });

      marker.addListener("click", () => {
        info.open(map, marker);
        if (onMarkerClick) onMarkerClick(match);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat, lng });
    });

    // Fit bounds to all markers if there are any
    if (matches.length > 0) {
      map.fitBounds(bounds);
      if (matches.length === 1) map.setZoom(14);
    }
  }, [map, matches, onMarkerClick]);

  if (error) {
    return (
      <div
        className="card flex flex-col items-center justify-center text-center p-6"
        style={{ height }}
      >
        <MapPin size={28} className="text-slate-600 mb-2" />
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden relative" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 bg-dark-850/80 flex items-center justify-center z-10">
          <Loader2 size={20} className="animate-spin text-brand-400" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
