import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import { Spinner } from "../../components/common";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api.get(`/auth/verify-email/${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen bg-dark-850 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md card p-10 text-center">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Trophy size={20} className="text-white" />
        </div>
        {status === "loading" && (
          <>
            <Spinner size={40} className="mx-auto mb-4" />
            <p className="text-slate-400">Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle size={48} className="text-brand-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Email Verified! 🎉</h2>
            <p className="text-slate-400 text-sm mb-6">Your account is now fully activated.</p>
            <Link to="/home" className="btn-primary px-8">Start Playing</Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
            <p className="text-slate-400 text-sm mb-6">This link is invalid or has expired.</p>
            <Link to="/login" className="btn-secondary px-8">Back to Login</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
