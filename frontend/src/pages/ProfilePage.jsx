import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Star, Edit3, Camera, MapPin, Calendar, Trophy,
  Shield, Activity, MessageCircle, ChevronRight
} from "lucide-react";
import { selectCurrentUser } from "../features/auth/authSlice";
import { updateProfile } from "../features/auth/authSlice";
import { fetchMyMatches, selectMyMatches } from "../features/matches/matchSlice";
import Avatar from "../components/common/Avatar";
import MatchCard from "../components/match/MatchCard";
import { Modal, Spinner } from "../components/common";
import { SPORTS, SKILL_LEVELS, getSkillColor } from "../utils";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const myMatches = useSelector(selectMyMatches);

  const isOwnProfile = !userId || userId === currentUser?._id;

  const [profileUser, setProfileUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(!isOwnProfile);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [editForm, setEditForm] = useState({});

  const user = isOwnProfile ? currentUser : profileUser;

  useEffect(() => {
    if (isOwnProfile) {
      dispatch(fetchMyMatches());
    } else {
      setLoading(true);
      api.get(`/users/${userId}`)
        .then(({ data }) => setProfileUser(data.data))
        .catch(() => toast.error("User not found"))
        .finally(() => setLoading(false));
    }
    // Load reviews
    const uid = userId || currentUser?._id;
    if (uid) {
      api.get(`/reviews/user/${uid}`)
        .then(({ data }) => setReviews(data.data))
        .catch(() => {});
    }
  }, [userId, isOwnProfile, dispatch, currentUser?._id]);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        bio: user.bio || "",
        age: user.age || "",
        gender: user.gender || "",
        skillLevel: user.skillLevel || "beginner",
        preferredSports: user.preferredSports || [],
        searchRadius: user.searchRadius || 10,
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setEditLoading(true);
    try {
      await dispatch(updateProfile(editForm)).unwrap();
      toast.success("Profile updated!");
      setEditOpen(false);
    } catch (err) {
      toast.error(err || "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarLoading(true);
    try {
      await api.put("/users/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Avatar updated!");
      window.location.reload();
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const toggleSport = (sport) => {
    setEditForm((f) => ({
      ...f,
      preferredSports: f.preferredSports.includes(sport)
        ? f.preferredSports.filter((s) => s !== sport)
        : [...f.preferredSports, sport],
    }));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>;
  if (!user) return <div className="text-center py-20 text-slate-500">User not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile card */}
        <div className="card p-6 mb-4">
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar src={user.avatar} name={user.name} size="xl" />
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-700 transition-colors">
                  {avatarLoading ? <Spinner size={12} /> : <Camera size={12} className="text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black text-slate-100">{user.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-sm font-medium capitalize ${getSkillColor(user.skillLevel)}`}>
                      <Shield size={12} className="inline mr-1" />{user.skillLevel}
                    </span>
                    {user.location?.city && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={11} />{user.location.city}
                      </span>
                    )}
                    {user.age && <span className="text-xs text-slate-500">{user.age}y</span>}
                    {user.gender && <span className="text-xs text-slate-500 capitalize">{user.gender}</span>}
                  </div>
                </div>
                {isOwnProfile ? (
                  <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-2 text-sm flex-shrink-0">
                    <Edit3 size={14} /> Edit
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const { data } = await api.post("/chats/direct", { userId: user._id });
                        navigate(`/chat/${data.data._id}`);
                      } catch { toast.error("Failed to open chat"); }
                    }}
                    className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
                  >
                    <MessageCircle size={14} /> Message
                  </button>
                )}
              </div>
              {user.bio && <p className="text-sm text-slate-400 mt-3 leading-relaxed">{user.bio}</p>}
              {user.preferredSports?.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {user.preferredSports.map((s) => (
                    <span key={s} className={`badge badge-${s} capitalize`}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Activity, label: "Matches played",  value: user.matchesPlayed || 0 },
            { icon: Trophy,   label: "Organised",       value: user.matchesOrganised || 0 },
            { icon: Star,     label: "Avg rating",      value: user.averageRating > 0 ? user.averageRating : "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <Icon size={16} className="text-brand-400 mx-auto mb-2" />
              <p className="text-xl font-black text-slate-100">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="card p-4 mb-4">
            <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Star size={15} className="text-yellow-400" /> Reviews ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((rev) => (
                <div key={rev._id} className="flex gap-3">
                  <Avatar src={rev.reviewer?.avatar} name={rev.reviewer?.name} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{rev.reviewer?.name}</p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"} />
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p className="text-xs text-slate-400 mt-1">{rev.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organised matches */}
        {isOwnProfile && myMatches.length > 0 && (
          <div>
            <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Trophy size={15} className="text-brand-400" /> My Matches
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myMatches.slice(0, 4).map((m, i) => <MatchCard key={m._id} match={m} index={i} />)}
            </div>
          </div>
        )}
      </motion.div>

      {/* Edit profile modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Name</label>
              <input value={editForm.name || ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Age</label>
              <input type="number" value={editForm.age || ""} onChange={(e) => setEditForm((f) => ({ ...f, age: e.target.value }))} className="input" min={13} max={100} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Bio</label>
            <textarea value={editForm.bio || ""} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} className="input resize-none" rows={3} maxLength={300} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Gender</label>
            <select value={editForm.gender || ""} onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))} className="input">
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Skill Level</label>
            <div className="flex gap-2 flex-wrap">
              {SKILL_LEVELS.filter((s) => s.value !== "any").map((s) => (
                <button key={s.value} type="button"
                  onClick={() => setEditForm((f) => ({ ...f, skillLevel: s.value }))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    editForm.skillLevel === s.value ? "bg-brand-900/50 border-brand-700 text-brand-400" : "border-white/10 text-slate-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Preferred Sports</label>
            <div className="flex gap-2 flex-wrap">
              {SPORTS.map((s) => (
                <button key={s.value} type="button"
                  onClick={() => toggleSport(s.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    editForm.preferredSports?.includes(s.value) ? "bg-brand-900/50 border-brand-700 text-brand-400" : "border-white/10 text-slate-400"
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSaveProfile} disabled={editLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {editLoading ? <Spinner size={16} /> : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
