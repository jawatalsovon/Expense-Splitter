import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { Group, GroupMember, Expense, ExpensePayer, ExpenseSplit, Settlement } from "@/lib/types";
import { calculateMemberBalances } from "@/lib/balance";
import { toast } from "sonner";
import { Plus, LogOut, Users, Copy, X } from "lucide-react";

interface GroupWithBalance extends Group {
  memberCount: number;
  myBalance: number;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
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
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id, profiles(*)")
          .eq("group_id", group.id);

        const { data: expenses } = await supabase
          .from("expenses")
          .select("*, expense_payers(*), expense_splits(*)")
          .eq("group_id", group.id);

        const { data: settlements } = await supabase
          .from("settlements")
          .select("*")
          .eq("group_id", group.id);

        const memberList = (members || []).map((m) => ({
          user_id: m.user_id,
          profile: (m.profiles as any),
        })).filter((m) => m.profile);

        const balances = calculateMemberBalances(
          (expenses || []) as (Expense & { expense_payers: ExpensePayer[]; expense_splits: ExpenseSplit[] })[],
          settlements || [],
          memberList
        );

        const mine = balances.find((b) => b.user_id === user!.id);

        return {
          ...group,
          memberCount: members?.length || 0,
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

    // Diagnose auth state
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      toast.error("Not authenticated — please log out and log back in.");
      setSubmitting(false);
      return;
    }

    // Ensure profile exists before creating a group (FK dependency)
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
      toast.error(`Failed to create group: ${error?.message ?? "unknown error"}`);
      setSubmitting(false);
      return;
    }

    await supabase.from("group_members").insert({ group_id: group.id, user_id: user!.id });
    toast.success(`Group "${group.name}" created!`);
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
      toast.error("Invalid invite code. Please check and try again.");
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
      toast.info("You're already a member of this group.");
      setShowJoinModal(false);
      setJoinCode("");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user!.id });

    if (error) {
      toast.error("Failed to join group");
    } else {
      toast.success(`Joined "${group.name}"!`);
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

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">
              S
            </div>
            <span className="font-bold text-slate-800 tracking-tight">SplitBD</span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2">
                <Avatar color={profile.avatar_color} name={profile.display_name} size="sm" />
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{profile.display_name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Your Groups</h1>
            <p className="text-sm text-slate-500 mt-0.5">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-3 py-2 rounded-lg transition-colors"
            >
              Join
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus size={15} />
              Create
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-semibold text-slate-700 mb-1">No groups yet</h3>
            <p className="text-sm text-slate-500 mb-6">Create a group or join one with an invite code.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/group/${group.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{group.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                      <Users size={13} />
                      <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {Math.abs(group.myBalance) < 0.01 ? (
                      <span className="text-sm font-medium text-slate-400">Settled up</span>
                    ) : group.myBalance > 0 ? (
                      <div>
                        <div className="text-sm font-semibold text-emerald-600">{CURRENCY_SYMBOL}{group.myBalance.toFixed(2)}</div>
                        <div className="text-xs text-slate-400">you are owed</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-semibold text-red-500">{CURRENCY_SYMBOL}{Math.abs(group.myBalance).toFixed(2)}</div>
                        <div className="text-xs text-slate-400">you owe</div>
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
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-lg">Create Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name *</label>
                <input
                  autoFocus
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Flat 4B, Thailand Trip"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What's this group for?"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!createName.trim() || submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {submitting ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 text-lg">Join Group</h2>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invite Code</label>
              <input
                autoFocus
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD34"
                maxLength={8}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={joinGroup}
                disabled={joinCode.length !== 8 || submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {submitting ? "Joining..." : "Join Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
