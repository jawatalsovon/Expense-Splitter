import { Link } from "wouter";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center font-bold text-indigo-950 text-sm">
            S
          </div>
          <span className="font-bold text-lg tracking-tight">Hisab</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-indigo-200 hover:text-white transition-colors px-3 py-2">
            Log In
          </Link>
          <Link href="/signup" className="text-sm bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Sign Up Free
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-800/50 border border-indigo-700/50 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            Free to use, no credit card required
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Split expenses.
            <br />
            <span className="text-indigo-400">Not friendships.</span>
          </h1>

          <p className="text-lg text-indigo-200 max-w-xl mx-auto mb-10 leading-relaxed">
            Track shared expenses with friends, family, and roommates. See who owes what, settle up instantly, and keep things fair — always.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-indigo-500 hover:bg-indigo-400 text-white text-base font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/50"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 text-white text-base font-semibold px-8 py-3.5 rounded-xl transition-colors border border-white/20"
            >
              Log In
            </Link>
          </div>
        </div>

        <div className="mt-24 grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: "👥",
              title: "Group Expense Tracking",
              desc: "Create groups for trips, households, or events. Add expenses with flexible split options.",
            },
            {
              icon: "⚡",
              title: "Real-Time Sync",
              desc: "Everyone in the group sees updates instantly. No refresh needed, no confusion.",
            },
            {
              icon: `${CURRENCY_SYMBOL}`,
              title: "Smart Settlement",
              desc: "Our algorithm calculates the minimum number of payments to zero out all debts.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-indigo-300 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
