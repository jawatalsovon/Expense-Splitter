import { useState, useEffect, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LangContext";
import { Avatar } from "@/components/Avatar";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { calculateMemberBalances, simplifyDebts } from "@/lib/balance";
import type { Group, GroupMember, Expense, ExpensePayer, ExpenseSplit, Settlement, MemberBalance, SimplifiedDebt, Profile, Repayment } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Plus, Copy, Check, ChevronDown, ChevronUp, Trash2, Users, Receipt, BarChart2, Sun, Moon, ChevronRight } from "lucide-react";

type Tab = "balances" | "expenses" | "members";

type FullExpense = Expense & {
  expense_payers: (ExpensePayer & { profiles: Profile })[];
  expense_splits: (ExpenseSplit & { profiles: Profile })[];
  profiles: Profile;
};

type RepaymentWithProfiles = Repayment & {
  payer_profile: Profile;
  payee_profile: Profile;
};

export default function GroupPage() {
  const [match, params] = useRoute("/group/:groupId");
  const groupId = params?.groupId;
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, T } = useLang();
  const [tab, setTab] = useState<Tab>("balances");
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(GroupMember & { profiles: Profile })[]>([]);
  const [expenses, setExpenses] = useState<FullExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [repayments, setRepayments] = useState<RepaymentWithProfiles[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [debts, setDebts] = useState<SimplifiedDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [markingDebt, setMarkingDebt] = useState<SimplifiedDebt | null>(null);
  const [repaymentNote, setRepaymentNote] = useState("");
  const [submittingRepayment, setSubmittingRepayment] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);
  const [showRepaymentHistory, setShowRepaymentHistory] = useState(false);

  const loadData = useCallback(async () => {
    if (!groupId) return;

    const [groupRes, membersRes, expensesRes, settlementsRes, repaymentsRes] = await Promise.all([
      supabase.from("groups").select("*").eq("id", groupId).single(),
      supabase.from("group_members").select("*, profiles(*)").eq("group_id", groupId),
      supabase.from("expenses").select("*, profiles(*), expense_payers(*, profiles(*)), expense_splits(*, profiles(*))").eq("group_id", groupId).order("created_at", { ascending: false }),
      supabase.from("settlements").select("*").eq("group_id", groupId),
      supabase.from("repayments").select("*, payer_profile:paid_by(id, display_name, avatar_color), payee_profile:paid_to(id, display_name, avatar_color)").eq("group_id", groupId).order("created_at", { ascending: false }),
    ]);

    if (groupRes.data) setGroup(groupRes.data);
    if (membersRes.data) setMembers(membersRes.data as any);
    if (expensesRes.data) setExpenses(expensesRes.data as FullExpense[]);
    if (settlementsRes.data) setSettlements(settlementsRes.data);
    if (repaymentsRes.data) setRepayments(repaymentsRes.data as RepaymentWithProfiles[]);

    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!members.length) return;
    const memberList = members.map((m) => ({ user_id: m.user_id, profile: m.profiles }));
    const newBalances = calculateMemberBalances(expenses as any, settlements, memberList, repayments);
    setBalances(newBalances);
    setDebts(simplifyDebts(newBalances));
  }, [members, expenses, settlements, repayments]);

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` }, (payload) => {
        loadData();
        if (payload.eventType === "INSERT") toast.info(T.newExpenseAdded);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settlements", filter: `group_id=eq.${groupId}` }, () => {
        loadData();
        toast.info(T.settlementRecorded);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "repayments", filter: `group_id=eq.${groupId}` }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, loadData, T]);

  async function recordRepayment(debt: SimplifiedDebt) {
    setSubmittingRepayment(true);
    const { error } = await supabase.from("repayments").insert({
      group_id: groupId,
      paid_by: debt.from,
      paid_to: debt.to,
      amount: debt.amount,
      note: repaymentNote.trim() || null,
    });
    if (error) {
      toast.error(T.failedCreate);
    } else {
      toast.success(T.repaymentRecordedMsg(`${CURRENCY_SYMBOL}${debt.amount.toFixed(2)}`));
      setMarkingDebt(null);
      setRepaymentNote("");
      loadData();
    }
    setSubmittingRepayment(false);
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

  const cardCls = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl";
  const inputCls = "w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  if (!match) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300">{T.groupNotFound}</p>
          <Link href="/dashboard" className="text-indigo-600 text-sm mt-2 block">{T.backToDashboard}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-slate-800 dark:text-slate-100 truncate">{group.name}</h1>
              {group.description && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{group.description}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleLang}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2 py-1.5 rounded-lg transition-colors"
              >
                {lang === "en" ? "বাং" : "EN"}
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {myBalance !== undefined && (
        <div className={`border-b px-4 py-3 ${
          Math.abs(myBalance.netBalance) < 0.01
            ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            : myBalance.netBalance > 0
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"
        }`}>
          <div className="max-w-2xl mx-auto text-center">
            {Math.abs(myBalance.netBalance) < 0.01 ? (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{T.youAreSettled}</p>
            ) : myBalance.netBalance > 0 ? (
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {T.youAreOwedOverall(`${CURRENCY_SYMBOL}${myBalance.netBalance.toFixed(2)}`)}
              </p>
            ) : (
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {T.youOweOverall(`${CURRENCY_SYMBOL}${Math.abs(myBalance.netBalance).toFixed(2)}`)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-[57px] z-10">
          {([
            { key: "balances", label: T.balances, icon: BarChart2 },
            { key: "expenses", label: T.expenses, icon: Receipt },
            { key: "members", label: T.membersTab, icon: Users },
          ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{T.memberBalances}</h3>
                <div className="space-y-2">
                  {balances.map((b) => (
                    <div key={b.user_id} className={`${cardCls} p-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <Avatar color={b.profile.avatar_color} name={b.profile.display_name} size="sm" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{b.profile.display_name}</span>
                        {b.user_id === user?.id && <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{T.youLower}</span>}
                      </div>
                      <div className={`text-sm font-semibold ${Math.abs(b.netBalance) < 0.01 ? "text-slate-400 dark:text-slate-500" : b.netBalance > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {Math.abs(b.netBalance) < 0.01 ? T.settledUp : b.netBalance > 0 ? `+${CURRENCY_SYMBOL}${b.netBalance.toFixed(2)}` : `-${CURRENCY_SYMBOL}${Math.abs(b.netBalance).toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {debts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{T.simplifiedSettlements}</h3>
                  <div className="space-y-2">
                    {debts.map((d, i) => (
                      <div key={i} className={`${cardCls} p-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                            <Avatar color={d.fromProfile.avatar_color} name={d.fromProfile.display_name} size="xs" />
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{d.from === user?.id ? T.you : d.fromProfile.display_name}</span>
                            <span className="text-slate-400 dark:text-slate-500 text-xs flex-shrink-0">{T.owes}</span>
                            <Avatar color={d.toProfile.avatar_color} name={d.toProfile.display_name} size="xs" />
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{d.to === user?.id ? T.youLower : d.toProfile.display_name}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 flex-shrink-0">{CURRENCY_SYMBOL}{d.amount.toFixed(2)}</span>
                          </div>
                          {(d.from === user?.id || isGroupCreator) && (
                            <button
                              onClick={() => { setMarkingDebt(d); setRepaymentNote(""); }}
                              className="ml-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0"
                            >
                              {T.markAsPaid}
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
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{T.allSettledUp}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{T.noDebts}</p>
                </div>
              )}

              {/* Repayment History */}
              <div>
                <button
                  onClick={() => setShowRepaymentHistory((v) => !v)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <span>{T.repaymentHistory} {repayments.length > 0 && `(${repayments.length})`}</span>
                  {showRepaymentHistory ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
                </button>
                {showRepaymentHistory && (
                  <div className="space-y-2">
                    {repayments.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">{T.noRepayments}</p>
                    ) : (
                      repayments.map((r) => (
                        <div key={r.id} className={`${cardCls} p-3`}>
                          <div className="flex items-center gap-2.5">
                            <Avatar color={r.payer_profile.avatar_color} name={r.payer_profile.display_name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-sm flex-wrap">
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {r.paid_by === user?.id ? T.you : r.payer_profile.display_name}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 text-xs">{T.paid}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{CURRENCY_SYMBOL}{Number(r.amount).toFixed(2)}</span>
                                <span className="text-slate-400 dark:text-slate-500 text-xs">{T.to}</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {r.paid_to === user?.id ? T.youLower : r.payee_profile.display_name}
                                </span>
                              </div>
                              {r.note && <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">{r.note}</p>}
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                              {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "expenses" && (
            <div>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">🧾</div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{T.noExpensesYet}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{T.noExpensesDesc}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp) => {
                    const isExpanded = expandedExpense === exp.id;
                    const canDelete = exp.created_by === user?.id || isGroupCreator;
                    const myShare = exp.expense_splits.find((s) => s.user_id === user?.id);

                    return (
                      <div key={exp.id} className={`${cardCls} overflow-hidden`}>
                        <div
                          className="p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          onClick={() => setExpandedExpense(isExpanded ? null : exp.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{exp.description}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <Avatar color={exp.profiles.avatar_color} name={exp.profiles.display_name} size="xs" />
                                <span>{exp.profiles.display_name} {T.paid}</span>
                                <span>·</span>
                                <span>{new Date(exp.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOL}{Number(exp.total_amount).toFixed(2)}</div>
                              {myShare && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">{T.yourShare}: {CURRENCY_SYMBOL}{Number(myShare.share_amount).toFixed(2)}</div>
                              )}
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-slate-400 mt-0.5" /> : <ChevronDown size={16} className="text-slate-400 mt-0.5" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-700 px-3.5 py-3 bg-slate-50 dark:bg-slate-700/40 text-sm space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5">{T.paidBy}</p>
                              <div className="space-y-1">
                                {exp.expense_payers.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar color={p.profiles.avatar_color} name={p.profiles.display_name} size="xs" />
                                      <span className="text-slate-700 dark:text-slate-200">{p.user_id === user?.id ? T.you : p.profiles.display_name}</span>
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOL}{Number(p.amount_paid).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5">{T.splitAmong}</p>
                              <div className="space-y-1">
                                {exp.expense_splits.map((s) => (
                                  <div key={s.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar color={s.profiles.avatar_color} name={s.profiles.display_name} size="xs" />
                                      <span className="text-slate-700 dark:text-slate-200">{s.user_id === user?.id ? T.you : s.profiles.display_name}</span>
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOL}{Number(s.share_amount).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {exp.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic">{exp.notes}</p>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeletingExpense(exp.id)}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={13} /> {T.deleteExpense}
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
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{T.inviteCode}</h3>
                <div className={`${cardCls} p-4 flex items-center justify-between`}>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{T.shareCode}</p>
                    <p className="font-mono font-bold text-xl text-slate-800 dark:text-slate-100 tracking-widest">{group.invite_code}</p>
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="flex items-center gap-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg transition-colors font-medium"
                  >
                    {codeCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {codeCopied ? T.copied : T.copyCode}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{T.membersTab} ({members.length})</h3>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className={`${cardCls} p-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <Avatar color={m.profiles.avatar_color} name={m.profiles.display_name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.profiles.display_name}</p>
                          {m.user_id === group.created_by && (
                            <p className="text-xs text-indigo-500">{T.groupCreator}</p>
                          )}
                        </div>
                      </div>
                      {m.user_id === user?.id && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">{T.youLower}</span>
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

      {/* Mark as Paid Modal */}
      {markingDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg mb-2">{T.recordRepayment}</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              {T.willPayAmount(
                markingDebt.from === user?.id ? T.you : markingDebt.fromProfile.display_name,
                `${CURRENCY_SYMBOL}${markingDebt.amount.toFixed(2)}`,
                markingDebt.to === user?.id ? T.youLower : markingDebt.toProfile.display_name
              )}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{T.repaymentNote}</label>
              <input
                type="text"
                value={repaymentNote}
                onChange={(e) => setRepaymentNote(e.target.value)}
                placeholder={T.repaymentNotePlaceholder}
                className={inputCls}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setMarkingDebt(null); setRepaymentNote(""); }}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                {T.cancel}
              </button>
              <button
                onClick={() => recordRepayment(markingDebt)}
                disabled={submittingRepayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {submittingRepayment ? T.saving : T.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg mb-2">{T.deleteExpenseTitle}</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-5">{T.deleteExpenseDesc}</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingExpense(null)} className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">{T.cancel}</button>
              <button onClick={() => deleteExpense(deletingExpense)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">{T.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
