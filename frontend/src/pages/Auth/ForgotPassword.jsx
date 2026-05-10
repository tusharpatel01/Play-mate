// ─── ForgotPassword.jsx ───────────────────────────────────
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Trophy, Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import { Spinner } from "../../components/common";
import toast from "react-hot-toast";

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-850 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Trophy size={20} className="text-white" />
            </div>
            <span className="font-black text-2xl">PlayMate</span>
          </Link>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1">We'll send a reset link to your email</p>
        </div>
        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-brand-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Email Sent!</h2>
              <p className="text-slate-400 text-sm mb-6">Check your inbox for the password reset link.</p>
              <Link to="/login" className="btn-primary px-8">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input {...register("email", { required: true })} type="email" placeholder="you@example.com" className="input pl-9" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
                {loading ? <Spinner size={18} /> : "Send Reset Link"}
              </button>
              <p className="text-center text-sm text-slate-500">
                <Link to="/login" className="text-brand-400 hover:text-brand-300">← Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
