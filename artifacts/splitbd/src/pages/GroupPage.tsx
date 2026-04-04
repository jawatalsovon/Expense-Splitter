import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { calculateMemberBalances, simplifyDebts } from "@/lib/balance";
import type { Group, GroupMember, Expense, ExpensePayer, ExpenseSplit, Settlement, MemberBalance, SimplifiedDebt, Profile } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Plus, Copy, Check, ChevronDown, ChevronUp, Trash2, Users, Receipt, BarChart2, X } from "lucide-react";

type Tab = "balances" | "expenses" | "members";

type FullExpense = Expense & {
  expense_payers: (ExpensePayer & { profiles: Profile })[];
  expense_splits: (ExpenseSplit & { profiles: Profile })[];
  profiles: Profile;
};

export default function GroupPage() {
  const [match, params] = useRoute("/group/:groupId");
  const groupId = params?.groupId;
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>("balances");
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(GroupMember & { profiles: Profile })[]>([]);
  const [expenses, setExpenses] = useState<FullExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [settlingDebt, setSettlingDebt] = useState<SimplifiedDebt | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!groupId) return;

    const [groupRes, membersRes, expensesRes, settlementsRes] = await Promise.all([
      supabase.from("groups").select("*").eq("id", groupId).single(),
      supabase.from("group_members").select("*, profiles(*)").eq("group_id", groupId),
      supabase.from("expenses").select("*, profiles(*), expense_payers(*, profiles(*)), expense_splits(*, profiles(*))").eq("group_id", groupId).order("created_at", { ascending: false }),
      supabase.from("settlements").select("*").eq("group_id", groupId),
    ]);

    if (groupRes.data) setGroup(groupRes.data);
    if (membersRes.data) setMembers(membersRes.data as any);
    if (expensesRes.data) setExpenses(expensesRes.data as FullExpense[]);
    if (settlementsRes.data) setSettlements(settlementsRes.data);

    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!members.length) return;
    const memberList = members.map((m) => ({ user_id: m.user_id, profile: m.profiles }));
    const newBalances = calculateMemberBalances(expenses as any, settlements, memberList);
    setBalances(newBalances);
    setDebts(simplifyDebts(newBalances));
  }, [members, expenses, settlements]);

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` }, (payload) => {
        loadData();
        if (payload.eventType === "INSERT") {
          toast.info("A new expense was added");
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settlements", filter: `group_id=eq.${groupId}` }, () => {
        loadData();
        toast.info("A settlement was recorded");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, loadData]);

  async function settleDebt(debt: SimplifiedDebt) {
    setSettlingDebt(null);
    const { error } = await supabase.from("settlements").insert({
      group_id: groupId,
      paid_by: debt.from,
      paid_to: debt.to,
      amount: debt.amount,
    });
    if (error) {
      toast.error("Failed to record settlement");
    } else {
      toast.success(`Settled ${CURRENCY_SYMBOL}${debt.amount.toFixed(2)}`);
      loadData();
    }
  }

  async function deleteExpense(expenseId: string) {
    setDeletingExpense(null);
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) {
      toast.error("Failed to delete expense");
    } else {
      toast.success("Expense deleted");
      loadData();
    }
  }

  function copyInviteCode() {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const myBalance = balances.find((b) => b.user_id === user?.id);
  const isGroupCreator = group?.created_by === user?.id;

  if (!match) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Group not found.</p>
          <Link href="/dashboard" className="text-indigo-600 text-sm mt-2 block">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-slate-800 truncate">{group.name}</h1>
              {group.description && <p className="text-xs text-slate-500 truncate">{group.description}</p>}
            </div>
          </div>
        </div>
      </nav>

      {myBalance !== undefined && (
        <div className={`border-b px-4 py-3 ${Math.abs(myBalance.netBalance) < 0.01 ? "bg-slate-100 border-slate-200" : myBalance.netBalance > 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
          <div className="max-w-2xl mx-auto text-center">
            {Math.abs(myBalance.netBalance) < 0.01 ? (
              <p className="text-sm font-medium text-slate-500">You are all settled up</p>
            ) : myBalance.netBalance > 0 ? (
              <p className="text-sm font-semibold text-emerald-700">
                You are owed <span className="font-bold">{CURRENCY_SYMBOL}{myBalance.netBalance.toFixed(2)}</span> overall
              </p>
            ) : (
              <p className="text-sm font-semibold text-red-700">
                You owe <span className="font-bold">{CURRENCY_SYMBOL}{Math.abs(myBalance.netBalance).toFixed(2)}</span> overall
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex border-b border-slate-200 bg-white sticky top-[57px] z-10">
          {([
            { key: "balances", label: "Balances", icon: BarChart2 },
            { key: "expenses", label: "Expenses", icon: Receipt },
            { key: "members", label: "Members", icon: Users },
          ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="px-4 py-5">
          {tab === "balances" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Member Balances</h3>
                <div className="space-y-2">
                  {balances.map((b) => (
                    <div key={b.user_id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar color={b.profile.avatar_color} name={b.profile.display_name} size="sm" />
                        <span className="text-sm font-medium text-slate-700">{b.profile.display_name}</span>
                        {b.user_id === user?.id && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">you</span>}
                      </div>
                      <div className={`text-sm font-semibold ${Math.abs(b.netBalance) < 0.01 ? "text-slate-400" : b.netBalance > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {Math.abs(b.netBalance) < 0.01 ? "Settled" : b.netBalance > 0 ? `+${CURRENCY_SYMBOL}${b.netBalance.toFixed(2)}` : `-${CURRENCY_SYMBOL}${Math.abs(b.netBalance).toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {debts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Simplified Settlements</h3>
                  <div className="space-y-2">
                    {debts.map((d, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                            <Avatar color={d.fromProfile.avatar_color} name={d.fromProfile.display_name} size="xs" />
                            <span className="font-medium text-slate-700 truncate">{d.from === user?.id ? "You" : d.fromProfile.display_name}</span>
                            <span className="text-slate-400 text-xs flex-shrink-0">owes</span>
                            <Avatar color={d.toProfile.avatar_color} name={d.toProfile.display_name} size="xs" />
                            <span className="font-medium text-slate-700 truncate">{d.to === user?.id ? "you" : d.toProfile.display_name}</span>
                            <span className="font-bold text-slate-800 flex-shrink-0">{CURRENCY_SYMBOL}{d.amount.toFixed(2)}</span>
                          </div>
                          {(d.from === user?.id || isGroupCreator) && (
                            <button
                              onClick={() => setSettlingDebt(d)}
                              className="ml-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0"
                            >
                              Settle Up
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {debts.length === 0 && balances.length > 0 && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="font-semibold text-slate-700">All settled up!</p>
                  <p className="text-sm text-slate-500 mt-1">No outstanding debts in this group.</p>
                </div>
              )}
            </div>
          )}

          {tab === "expenses" && (
            <div>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">🧾</div>
                  <p className="font-semibold text-slate-700 mb-1">No expenses yet</p>
                  <p className="text-sm text-slate-500">Add the first expense for this group.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp) => {
                    const isExpanded = expandedExpense === exp.id;
                    const canDelete = exp.created_by === user?.id || isGroupCreator;
                    const myShare = exp.expense_splits.find((s) => s.user_id === user?.id);
                    const myPaid = exp.expense_payers.find((p) => p.user_id === user?.id);

                    return (
                      <div key={exp.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div
                          className="p-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedExpense(isExpanded ? null : exp.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-800 truncate">{exp.description}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Avatar color={exp.profiles.avatar_color} name={exp.profiles.display_name} size="xs" />
                                <span>{exp.profiles.display_name} paid</span>
                                <span>·</span>
                                <span>{new Date(exp.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-slate-800">{CURRENCY_SYMBOL}{Number(exp.total_amount).toFixed(2)}</div>
                              {myShare && (
                                <div className="text-xs text-slate-500">your share: {CURRENCY_SYMBOL}{Number(myShare.share_amount).toFixed(2)}</div>
                              )}
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-slate-400 mt-0.5" /> : <ChevronDown size={16} className="text-slate-400 mt-0.5" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-100 px-3.5 py-3 bg-slate-50 text-sm space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-1.5">PAID BY</p>
                              <div className="space-y-1">
                                {exp.expense_payers.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar color={p.profiles.avatar_color} name={p.profiles.display_name} size="xs" />
                                      <span className="text-slate-700">{p.user_id === user?.id ? "You" : p.profiles.display_name}</span>
                                    </div>
                                    <span className="font-medium text-slate-800">{CURRENCY_SYMBOL}{Number(p.amount_paid).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 mb-1.5">SPLIT AMONG</p>
                              <div className="space-y-1">
                                {exp.expense_splits.map((s) => (
                                  <div key={s.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar color={s.profiles.avatar_color} name={s.profiles.display_name} size="xs" />
                                      <span className="text-slate-700">{s.user_id === user?.id ? "You" : s.profiles.display_name}</span>
                                    </div>
                                    <span className="font-medium text-slate-800">{CURRENCY_SYMBOL}{Number(s.share_amount).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {exp.notes && (
                              <p className="text-xs text-slate-500 italic">{exp.notes}</p>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeletingExpense(exp.id)}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={13} /> Delete expense
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "members" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Invite Code</h3>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Share this code to invite people</p>
                    <p className="font-mono font-bold text-xl text-slate-800 tracking-widest">{group.invite_code}</p>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="flex items-center gap-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors font-medium"
                  >
                    {codeCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {codeCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Members ({members.length})</h3>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar color={m.profiles.avatar_color} name={m.profiles.display_name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{m.profiles.display_name}</p>
                          {m.user_id === group.created_by && (
                            <p className="text-xs text-indigo-500">Group creator</p>
                          )}
                        </div>
                      </div>
                      {m.user_id === user?.id && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">you</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {tab === "expenses" && (
        <button
          onClick={() => setShowAddExpense(true)}
          className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-20"
        >
          <Plus size={24} />
        </button>
      )}

      {showAddExpense && group && (
        <AddExpenseModal
          group={group}
          members={members.map((m) => ({ user_id: m.user_id, profile: m.profiles }))}
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => { setShowAddExpense(false); loadData(); }}
        />
      )}

      {settlingDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 text-lg mb-2">Confirm Settlement</h2>
            <p className="text-slate-600 text-sm mb-5">
              <span className="font-medium">{settlingDebt.from === user?.id ? "You" : settlingDebt.fromProfile.display_name}</span>
              {" "} will pay <span className="font-bold text-slate-800">{CURRENCY_SYMBOL}{settlingDebt.amount.toFixed(2)}</span>{" "}
              to <span className="font-medium">{settlingDebt.to === user?.id ? "you" : settlingDebt.toProfile.display_name}</span>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSettlingDebt(null)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors font-medium">Cancel</button>
              <button onClick={() => settleDebt(settlingDebt)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {deletingExpense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 text-lg mb-2">Delete Expense?</h2>
            <p className="text-slate-600 text-sm mb-5">This will permanently remove the expense and recalculate all balances.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingExpense(null)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors font-medium">Cancel</button>
              <button onClick={() => deleteExpense(deletingExpense)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
