import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, ChevronLeft, CheckCircle, Navigation } from "lucide-react";
import { createMatch } from "../features/matches/matchSlice";
import { useGeolocation } from "../hooks";
import { SPORTS, SKILL_LEVELS } from "../utils";
import { Spinner } from "../components/common";
import PlacesAutocomplete from "../components/match/PlacesAutocomplete";
import toast from "react-hot-toast";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().max(500).optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.string().optional(),
  totalSlots: z.string().min(1).refine((v) => parseInt(v) >= 2, "Min 2 players"),
  entryFee: z.string().optional(),
});

const STEPS = ["Sport", "Details", "Location", "Settings"];

export default function CreateMatch() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { location: userLoc } = useGeolocation();
  const loading = useSelector((s) => s.matches.loading);

  const [step, setStep] = useState(0);
  const [sport, setSport] = useState("");
  const [skillRequired, setSkillRequired] = useState("any");
  const [visibility, setVisibility] = useState("public");

  // Location state — set by PlacesAutocomplete OR by "use current"
  const [pickedLocation, setPickedLocation] = useState(null); // { lat, lng, address, city, groundName }

  const { register, handleSubmit, trigger, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
  });

  const validateStep = async () => {
    const fieldsByStep = [
      [],
      ["title", "date", "startTime", "totalSlots"],
      [], // location validated manually
      [],
    ];
    return trigger(fieldsByStep[step]);
  };

  const next = async () => {
    if (step === 0 && !sport) {
      toast.error("Please select a sport");
      return;
    }
    if (step === 2 && !pickedLocation) {
      toast.error("Please select a location from the dropdown or use your current location");
      return;
    }
    if (step > 0) {
      const valid = await validateStep();
      if (!valid) return;
    }
    setStep((s) => s + 1);
  };

  // ─── Use current location button ───────────────────
  const handleUseCurrent = async () => {
    if (!userLoc) {
      toast.error("Location access required. Please allow location.");
      return;
    }
    // Reverse-geocode current coords using Google Maps API
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      // No API key — store coords with placeholder text
      setPickedLocation({
        lat: userLoc.lat,
        lng: userLoc.lng,
        address: `Current location (${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)})`,
        city: "",
        groundName: "",
      });
      toast.success("Using current location");
      return;
    }

    try {
      const { loadGoogleMaps } = await import("../components/common/MatchMap");
      const google = await loadGoogleMaps(apiKey);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: userLoc.lat, lng: userLoc.lng } },
        (results, status) => {
          if (status === "OK" && results[0]) {
            const place = results[0];
            const cityComp = place.address_components?.find((c) =>
              c.types.some((t) =>
                ["locality", "administrative_area_level_2", "postal_town"].includes(t)
              )
            );
            setPickedLocation({
              lat: userLoc.lat,
              lng: userLoc.lng,
              address: place.formatted_address,
              city: cityComp?.long_name || "",
              groundName: "",
            });
            toast.success("Current location set");
          } else {
            setPickedLocation({
              lat: userLoc.lat,
              lng: userLoc.lng,
              address: `${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}`,
              city: "",
              groundName: "",
            });
            toast.success("Using current coordinates");
          }
        }
      );
    } catch {
      toast.error("Couldn't reverse-geocode location");
    }
  };

  // ─── Submit ──────────────────────────────────────
  const onSubmit = async (data) => {
    if (!sport) { toast.error("Please select a sport"); setStep(0); return; }
    if (!pickedLocation) { toast.error("Please select a location"); setStep(2); return; }

    const result = await dispatch(createMatch({
      ...data,
      sport,
      skillRequired,
      visibility,
      lat: pickedLocation.lat,
      lng: pickedLocation.lng,
      address: pickedLocation.address,
      city: pickedLocation.city || "",
      groundName: pickedLocation.groundName || "",
      duration: data.duration || 120,
      entryFee: data.entryFee || 0,
    }));

    if (createMatch.fulfilled.match(result)) {
      toast.success("Match created! 🎉");
      navigate(`/matches/${result.payload._id}`);
    } else {
      toast.error(result.payload || "Failed to create match");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Create a Match</h1>
        <p className="text-sm text-slate-500 mt-0.5">Fill your squad and start playing</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step ? "bg-brand-600 text-white" :
              i === step ? "bg-brand-900/80 border-2 border-brand-600 text-brand-400" :
              "bg-white/5 text-slate-500"
            }`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? "text-brand-400 font-medium" : "text-slate-500"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? "bg-brand-600" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* ─── Step 0: Sport ───────────────────────── */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6">
                <h2 className="font-bold text-lg mb-1">Choose a sport</h2>
                <p className="text-slate-500 text-sm mb-5">What sport is this match for?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SPORTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSport(s.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        sport === s.value
                          ? "border-brand-600 bg-brand-900/40"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-3xl mb-2">{s.emoji}</div>
                      <p className={`text-sm font-semibold ${sport === s.value ? "text-brand-400" : "text-slate-300"}`}>
                        {s.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Step 1: Details ─────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg mb-1">Match details</h2>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Match Title *</label>
                  <input {...register("title")} placeholder="e.g. Evening Cricket at Siri Fort" className="input" />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Description</label>
                  <textarea {...register("description")} placeholder="Tell players what to expect..." className="input resize-none" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Date *</label>
                    <input {...register("date")} type="date" min={today} className="input" />
                    {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Start Time *</label>
                    <input {...register("startTime")} type="time" className="input" />
                    {errors.startTime && <p className="text-red-400 text-xs mt-1">{errors.startTime.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Players needed *</label>
                    <input {...register("totalSlots")} type="number" min={2} max={50} placeholder="11" className="input" />
                    {errors.totalSlots && <p className="text-red-400 text-xs mt-1">{errors.totalSlots.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">Duration (minutes)</label>
                    <input {...register("duration")} type="number" min={30} max={480} placeholder="120" className="input" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Entry fee (₹)</label>
                  <input {...register("entryFee")} type="number" min={0} placeholder="0 = Free" className="input" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Location (with autocomplete) ───── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6 space-y-4">
                <h2 className="font-bold text-lg mb-1">Location</h2>
                <p className="text-slate-500 text-sm mb-3">
                  Search for a venue or address — suggestions appear as you type.
                </p>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Venue / Address *
                  </label>
                  <PlacesAutocomplete
                    value={pickedLocation?.address || ""}
                    onSelect={(loc) => setPickedLocation(loc)}
                    placeholder="Try 'Siri Fort Sports Complex' or 'JLN Stadium'"
                  />
                </div>

                {/* Use current location button */}
                {userLoc && (
                  <button
                    type="button"
                    onClick={handleUseCurrent}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-brand-900/30 border border-brand-800/50 text-brand-400 hover:bg-brand-900/50 transition-colors text-sm font-medium"
                  >
                    <Navigation size={14} />
                    Use my current location
                  </button>
                )}

                {/* Selected location preview */}
                {pickedLocation && (
                  <div className="bg-white/5 rounded-xl p-4 border border-brand-800/40">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {pickedLocation.groundName && (
                          <p className="text-sm font-semibold text-slate-100">
                            {pickedLocation.groundName}
                          </p>
                        )}
                        <p className="text-sm text-slate-300">
                          {pickedLocation.address}
                        </p>
                        {pickedLocation.city && (
                          <p className="text-xs text-slate-500 mt-1">
                            {pickedLocation.city}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-600 mt-1.5 font-mono">
                          {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── Step 3: Settings ─────────────────────── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-6 space-y-5">
                <h2 className="font-bold text-lg mb-1">Settings & Review</h2>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block font-medium">Skill Level Required</label>
                  <div className="flex gap-2 flex-wrap">
                    {SKILL_LEVELS.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSkillRequired(s.value)}
                        className={`text-xs px-4 py-2 rounded-xl border transition-all ${
                          skillRequired === s.value
                            ? "bg-brand-900/50 border-brand-700 text-brand-400"
                            : "border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block font-medium">Visibility</label>
                  <div className="flex gap-2">
                    {["public", "private"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        className={`text-xs px-4 py-2 rounded-xl border transition-all capitalize ${
                          visibility === v
                            ? "bg-brand-900/50 border-brand-700 text-brand-400"
                            : "border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Match Summary</p>
                  {[
                    ["Sport",       SPORTS.find((s) => s.value === sport)?.label || sport],
                    ["Title",       watch("title")],
                    ["Date",        watch("date")],
                    ["Time",        watch("startTime")],
                    ["Players",     watch("totalSlots")],
                    ["Skill",       skillRequired],
                    ["Visibility",  visibility],
                    ["Entry",       watch("entryFee") > 0 ? `₹${watch("entryFee")}` : "Free"],
                    ["Location",    pickedLocation?.address],
                  ].map(([k, v]) => v && (
                    <div key={k} className="flex justify-between text-sm gap-3">
                      <span className="text-slate-500 flex-shrink-0">{k}</span>
                      <span className="text-slate-200 font-medium capitalize text-right truncate min-w-0">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              {loading ? <Spinner size={16} /> : <><CheckCircle size={16} /> Publish Match</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
