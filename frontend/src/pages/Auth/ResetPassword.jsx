// ─── ResetPassword.jsx ────────────────────────────────────
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Trophy, Lock } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import { Spinner } from "../../components/common";
import toast from "react-hot-toast";

export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ password }) => {
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-850 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  {...register("password", { required: true, minLength: { value: 6, message: "Min 6 characters" } })}
                  type="password" placeholder="New password" className="input pl-9"
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  {...register("confirmPassword", {
                    validate: (v) => v === watch("password") || "Passwords don't match",
                  })}
                  type="password" placeholder="Confirm new password" className="input pl-9"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading ? <Spinner size={18} /> : "Reset Password"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
