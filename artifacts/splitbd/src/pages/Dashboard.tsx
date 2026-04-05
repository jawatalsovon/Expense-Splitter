import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LangContext";
import { Avatar } from "@/components/Avatar";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { Group, GroupMember, Expense, ExpensePayer, ExpenseSplit, Settlement, Repayment } from "@/lib/types";
import { calculateMemberBalances } from "@/lib/balance";
import { toast } from "sonner";
import { Plus, LogOut, Users, X, Sun, Moon } from "lucide-react";

interface GroupWithBalance extends Group {
  memberCount: number;
  myBalance: number;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, T } = useLang();
  const [, setLocation] = useLocation();
  const [groups, setGroups] = useState<GroupWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  async function loadGroups() {
    setLoading(true);
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user!.id);

    if (!memberships?.length) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);

    const { data: groupsData } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    if (!groupsData) {
      setLoading(false);
      return;
    }

    const enriched: GroupWithBalance[] = await Promise.all(
      groupsData.map(async (group) => {
        const [membersRes, expensesRes, settlementsRes, repaymentsRes] = await Promise.all([
          supabase.from("group_members").select("user_id, profiles(*)").eq("group_id", group.id),
          supabase.from("expenses").select("*, expense_payers(*), expense_splits(*)").eq("group_id", group.id),
          supabase.from("settlements").select("*").eq("group_id", group.id),
          supabase.from("repayments").select("*").eq("group_id", group.id),
        ]);

        const memberList = (membersRes.data || []).map((m) => ({
          user_id: m.user_id,
          profile: (m.profiles as any),
        })).filter((m) => m.profile);

        const balances = calculateMemberBalances(
          (expensesRes.data || []) as (Expense & { expense_payers: ExpensePayer[]; expense_splits: ExpenseSplit[] })[],
          settlementsRes.data || [],
          memberList,
          repaymentsRes.data || []
        );

        const mine = balances.find((b) => b.user_id === user!.id);

        return {
          ...group,
          memberCount: membersRes.data?.length || 0,
          myBalance: mine?.netBalance || 0,
        };
      })
    );

    setGroups(enriched);
    setLoading(false);
  }

  async function createGroup() {
    if (!createName.trim()) return;
    setSubmitting(true);
    const inviteCode = generateInviteCode();

    if (!profile) {
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user!.id,
        display_name: user!.email?.split("@")[0] ?? "User",
        avatar_color: "#4F46E5",
      });
      if (profileErr) {
        toast.error(`Profile error: ${profileErr.message}`);
        setSubmitting(false);
        return;
      }
    }

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: createName.trim(), description: createDesc.trim() || null, created_by: user!.id, invite_code: inviteCode })
      .select()
      .single();

    if (error || !group) {
      toast.error(`${T.failedCreate}: ${error?.message ?? "unknown error"}`);
      setSubmitting(false);
      return;
    }

    await supabase.from("group_members").insert({ group_id: group.id, user_id: user!.id });
    toast.success(T.groupCreatedMsg(group.name));
    setCreateName("");
    setCreateDesc("");
    setShowCreateModal(false);
    loadGroups();
    setSubmitting(false);
  }

  async function joinGroup() {
    if (!joinCode.trim()) return;
    setSubmitting(true);

    const { data: group } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", joinCode.trim().toUpperCase())
      .single();

    if (!group) {
      toast.error(T.invalidCode);
      setSubmitting(false);
      return;
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user!.id)
      .single();

    if (existing) {
      toast.info(T.alreadyMember);
      setShowJoinModal(false);
      setJoinCode("");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user!.id });

    if (error) {
      toast.error(T.failedJoin);
    } else {
      toast.success(T.joinedMsg(group.name));
      setShowJoinModal(false);
      setJoinCode("");
      loadGroups();
    }
    setSubmitting(false);
  }

  function handleLogout() {
    signOut();
    setLocation("/login");
  }

  const inputCls = "w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/hisab-icon.png" className="w-7 h-7 rounded-lg" alt="Hisab" />
            <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{T.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              {lang === "en" ? "বাং" : "EN"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {profile && (
              <div className="flex items-center gap-2">
                <Avatar color={profile.avatar_color} name={profile.display_name} size="sm" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{profile.display_name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={T.logOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{T.yourGroups}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{T.groupsCount(groups.length)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="text-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium px-3 py-2 rounded-lg transition-colors"
            >
              {T.join}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus size={15} />
              {T.create}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{T.noGroupsYet}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{T.noGroupsDesc}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {T.createFirstGroup}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{group.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      <Users size={13} />
                      <span>{T.membersCount(group.memberCount)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {Math.abs(group.myBalance) < 0.01 ? (
                      <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{T.settledUp}</span>
                    ) : group.myBalance > 0 ? (
                      <div>
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{CURRENCY_SYMBOL}{group.myBalance.toFixed(2)}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{T.youAreOwed}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-semibold text-red-500 dark:text-red-400">{CURRENCY_SYMBOL}{Math.abs(group.myBalance).toFixed(2)}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">{T.youOwe}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{T.createGroup}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{T.groupName}</label>
                <input
                  autoFocus
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={T.groupNamePlaceholder}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{T.description}</label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder={T.descriptionPlaceholder}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {T.cancel}
              </button>
              <button
                onClick={createGroup}
                disabled={!createName.trim() || submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {submitting ? T.creatingGroup : T.createGroupBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{T.joinGroup}</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{T.inviteCode}</label>
              <input
                autoFocus
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={T.inviteCodePlaceholder}
                maxLength={8}
                className={`${inputCls} font-mono tracking-widest text-center`}
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {T.cancel}
              </button>
              <button
                onClick={joinGroup}
                disabled={joinCode.length !== 8 || submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {submitting ? T.joiningGroup : T.joinGroupBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
