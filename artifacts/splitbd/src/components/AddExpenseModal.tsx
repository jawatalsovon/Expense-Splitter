import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { Avatar } from "@/components/Avatar";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { Group, Profile } from "@/lib/types";
import { toast } from "sonner";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface Props {
  group: Group;
  members: { user_id: string; profile: Profile }[];
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface PayerEntry {
  user_id: string;
  amount: string;
}

export function AddExpenseModal({ group, members, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { T } = useLang();

  const [step, setStep] = useState<Step>(1);
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [multiplePayers, setMultiplePayers] = useState(false);
  const [payers, setPayers] = useState<PayerEntry[]>(
    members.map((m) => ({ user_id: m.user_id, amount: "" }))
  );
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id))
  );
  const [submitting, setSubmitting] = useState(false);

  const total = parseFloat(totalAmount) || 0;
  const payerTotal = payers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const splitCount = selectedSplitMembers.size;
  const sharePerPerson = splitCount > 0 ? total / splitCount : 0;

  function updatePayerAmount(userId: string, amount: string) {
    setPayers((prev) => prev.map((p) => p.user_id === userId ? { ...p, amount } : p));
  }

  function toggleSplitMember(userId: string) {
    setSelectedSplitMembers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size === 1) return prev;
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function getProfile(userId: string): Profile {
    return members.find((m) => m.user_id === userId)!.profile;
  }

  function canProceedStep1() {
    return description.trim() && total > 0;
  }

  function canProceedStep2() {
    if (!multiplePayers) return true;
    return Math.abs(payerTotal - total) < 0.01;
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);

    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        group_id: group.id,
        description: description.trim(),
        total_amount: total,
        created_by: user!.id,
        notes: notes.trim() || null,
      })
      .select()
      .single();

    if (expenseError || !expense) {
      toast.error(T.failedCreate);
      setSubmitting(false);
      return;
    }

    const payerInserts = multiplePayers
      ? payers
          .filter((p) => parseFloat(p.amount) > 0)
          .map((p) => ({ expense_id: expense.id, user_id: p.user_id, amount_paid: parseFloat(p.amount) }))
      : [{ expense_id: expense.id, user_id: payers[0]?.user_id ?? user!.id, amount_paid: total }];

    const splitInserts = Array.from(selectedSplitMembers).map((uid) => ({
      expense_id: expense.id,
      user_id: uid,
      share_amount: sharePerPerson,
    }));

    const [payerResult, splitResult] = await Promise.all([
      supabase.from("expense_payers").insert(payerInserts),
      supabase.from("expense_splits").insert(splitInserts),
    ]);

    if (payerResult.error || splitResult.error) {
      toast.error("Expense saved but split details failed. Please refresh.");
    } else {
      toast.success(T.expenseAddedMsg(description));
      onSuccess();
    }
    setSubmitting(false);
  }

  const stepTitles = [T.basicInfo, T.whoPaid, T.whoSplits, T.confirmStep];

  const inputCls = "w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">{T.addExpense}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{T.stepLabel} {step} {T.ofLabel} 4 — {stepTitles[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{T.descriptionLabel}</label>
                <input
                  autoFocus
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={T.descriptionExpensePlaceholder}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{T.totalAmount}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">{CURRENCY_SYMBOL}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls} pl-8`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{T.notesLabel}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={T.notesPlaceholder}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                {/* FIX: Reset payers to full members array when switching to single payer mode */}
                <button
                  onClick={() => {
                    setMultiplePayers(false);
                    setPayers(members.map((m) => ({ user_id: m.user_id, amount: "" })));
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!multiplePayers ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {T.singlePayer}
                </button>
                {/* FIX: Reset payers to full members array when switching to multiple payer mode */}
                <button
                  onClick={() => {
                    setMultiplePayers(true);
                    setPayers(members.map((m) => ({ user_id: m.user_id, amount: "" })));
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${multiplePayers ? "bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {T.multiplePayers}
                </button>
              </div>

              {!multiplePayers ? (
                <div className="space-y-2">
                  {members.map((m) => (
                    <button
                      key={m.user_id}
                      onClick={() => setPayers([{ user_id: m.user_id, amount: totalAmount }])}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                        payers[0]?.user_id === m.user_id
                          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <Avatar color={m.profile.avatar_color} name={m.profile.display_name} size="sm" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {m.user_id === user?.id ? `${m.profile.display_name} (${T.youLower})` : m.profile.display_name}
                      </span>
                      {payers[0]?.user_id === m.user_id && (
                        <Check size={16} className="ml-auto text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={`text-xs font-medium text-right mb-2 ${Math.abs(payerTotal - total) < 0.01 && payerTotal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {CURRENCY_SYMBOL}{payerTotal.toFixed(2)} / {CURRENCY_SYMBOL}{total.toFixed(2)}
                  </div>
                  {members.map((m) => (
                    <div key={m.user_id} className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <Avatar color={m.profile.avatar_color} name={m.profile.display_name} size="sm" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
                        {m.user_id === user?.id ? T.you : m.profile.display_name}
                      </span>
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{CURRENCY_SYMBOL}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payers.find((p) => p.user_id === m.user_id)?.amount || ""}
                          onChange={(e) => updatePayerAmount(m.user_id, e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                        />
                      </div>
                    </div>
                  ))}
                  {Math.abs(payerTotal - total) > 0.01 && payerTotal > 0 && (
                    <p className="text-xs text-red-500 dark:text-red-400 text-center">
                      {T.amountsMustSumMsg(`${CURRENCY_SYMBOL}${total.toFixed(2)}`)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                {T.eachPersonOwes} <span className="font-semibold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOL}{sharePerPerson.toFixed(2)}</span>
                {" "}({CURRENCY_SYMBOL}{total.toFixed(2)} ÷ {splitCount})
              </p>
              {members.map((m) => (
                <button
                  key={m.user_id}
                  onClick={() => toggleSplitMember(m.user_id)}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                    selectedSplitMembers.has(m.user_id)
                      ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                      : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    selectedSplitMembers.has(m.user_id) ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-500"
                  }`}>
                    {selectedSplitMembers.has(m.user_id) && <Check size={10} className="text-white" />}
                  </div>
                  <Avatar color={m.profile.avatar_color} name={m.profile.display_name} size="sm" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 text-left">
                    {m.user_id === user?.id ? `${m.profile.display_name} (${T.youLower})` : m.profile.display_name}
                  </span>
                  {selectedSplitMembers.has(m.user_id) && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">{CURRENCY_SYMBOL}{sharePerPerson.toFixed(2)}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{T.descriptionLabel.replace(" *", "")}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{T.totalAmount.replace(" *", "")}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOL}{total.toFixed(2)}</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">{T.paidByLabel}</p>
                  {(multiplePayers
                    ? payers.filter((p) => parseFloat(p.amount) > 0)
                    : [payers[0] || { user_id: user!.id, amount: totalAmount }]
                  ).map((p) => {
                    const prof = getProfile(p.user_id);
                    return (
                      <div key={p.user_id} className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Avatar color={prof.avatar_color} name={prof.display_name} size="xs" />
                          <span className="text-xs text-slate-700 dark:text-slate-200">{p.user_id === user?.id ? T.you : prof.display_name}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOL}{parseFloat(p.amount || totalAmount).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">{T.splitAmongLabel} ({splitCount})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selectedSplitMembers).map((uid) => {
                      const prof = getProfile(uid);
                      return (
                        <div key={uid} className="flex items-center gap-1 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-full px-2 py-0.5">
                          <Avatar color={prof.avatar_color} name={prof.display_name} size="xs" />
                          <span className="text-xs text-slate-700 dark:text-slate-200">{uid === user?.id ? T.you : prof.display_name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{CURRENCY_SYMBOL}{sharePerPerson.toFixed(2)} {T.each}</p>
                </div>
                {notes && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{T.notesKey}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-200 italic">{notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex items-center gap-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={16} /> {T.back}
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 ? !canProceedStep1() : step === 2 ? !canProceedStep2() : false}
              className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {T.continueBtn} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? T.saving : T.addExpenseBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
