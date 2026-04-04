import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { getRandomAvatarColor } from "@/lib/constants";
import { toast } from "sonner";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }
    setLoading(true);

    const avatarColor = getRandomAvatarColor();

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: displayName.trim(),
        avatar_color: avatarColor,
      });

      if (profileError) {
        toast.error("Account created but couldn't save profile. Please try logging in.");
      } else {
        toast.success("Account created! Welcome to SplitBD.");
        setLocation("/dashboard");
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-indigo-400 rounded-xl flex items-center justify-center font-bold text-indigo-950">
              S
            </div>
            <span className="font-bold text-xl text-white tracking-tight">SplitBD</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-indigo-300 text-sm mt-1">Free forever, no credit card needed</p>
        </div>

        <div className="bg-white/8 border border-white/15 rounded-2xl p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1.5">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others will see you"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-white placeholder-indigo-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-white placeholder-indigo-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3.5 py-2.5 text-white placeholder-indigo-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-indigo-300 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-white font-medium transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-xs text-indigo-500 hover:text-indigo-300 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
