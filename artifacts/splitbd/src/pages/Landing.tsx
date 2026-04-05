import { Link } from "wouter";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LangContext";
import { Sun, Moon } from "lucide-react";

export default function Landing() {
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, T } = useLang();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white">
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/hisab-icon.png" className="w-8 h-8 rounded-lg" alt="Hisab" />
          <span className="font-bold text-lg tracking-tight">{T.appName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-800/50 hover:bg-indigo-700/60 border border-indigo-700/50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            {lang === "en" ? "বাং" : "EN"}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-indigo-300 hover:text-white bg-indigo-800/50 hover:bg-indigo-700/60 border border-indigo-700/50 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link href="/login" className="text-sm text-indigo-200 hover:text-white transition-colors px-3 py-2">
            {T.logIn}
          </Link>
          <Link href="/signup" className="text-sm bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            {T.createAccount}
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-800/50 border border-indigo-700/50 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            {T.freeBadge}
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            {T.tagline1}
            <br />
            <span className="text-indigo-400">{T.tagline2}</span>
          </h1>

          <p className="text-lg text-indigo-200 max-w-xl mx-auto mb-10 leading-relaxed">
            {T.taglineDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-indigo-500 hover:bg-indigo-400 text-white text-base font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-900/50"
            >
              {T.createAccount}
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 text-white text-base font-semibold px-8 py-3.5 rounded-xl transition-colors border border-white/20"
            >
              {T.logIn}
            </Link>
          </div>
        </div>

        <div className="mt-24 grid sm:grid-cols-3 gap-6">
          {[
            { icon: "👥", title: T.featureGroups, desc: T.featureGroupsDesc },
            { icon: "⚡", title: T.featureRealtime, desc: T.featureRealtimeDesc },
            { icon: CURRENCY_SYMBOL, title: T.featureSmart, desc: T.featureSmartDesc },
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
