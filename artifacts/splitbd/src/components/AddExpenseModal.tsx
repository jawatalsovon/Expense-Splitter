import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
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

  const [step, setStep] = useState<Step>(1);
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [multiplePayers, setMultiplePayers] = useState(false);
  const [payers, setPayers] = useState<PayerEntry[]>(
    members.map((m) => ({ user_id: m.user_id, amount: m.user_id === user?.id ? "" : "" }))
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
      toast.error("Failed to create expense");
      setSubmitting(false);
      return;
    }

    const payerInserts = multiplePayers
      ? payers
          .filter((p) => parseFloat(p.amount) > 0)
          .map((p) => ({ expense_id: expense.id, user_id: p.user_id, amount_paid: parseFloat(p.amount) }))
      : [{ expense_id: expense.id, user_id: user!.id, amount_paid: total }];

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
      toast.success(`Expense "${description}" added!`);
      onSuccess();
    }
    setSubmitting(false);
  }

  const stepTitles = ["Basic Info", "Who Paid?", "Who Splits?", "Confirm"];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">Add Expense</h2>
            <p className="text-xs text-slate-400">Step {step} of 4 — {stepTitles[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
                <input
                  autoFocus
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Dinner, Bus fare, Groceries"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">{CURRENCY_SYMBOL}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra details..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <button
                  onClick={() => setMultiplePayers(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!multiplePayers ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}
                >
                  Single Payer
                </button>
                <button
                  onClick={() => setMultiplePayers(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${multiplePayers ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}
                >
                  Multiple Payers
                </button>
              </div>

              {!multiplePayers ? (
                <div className="space-y-2">
                  {members.map((m) => (
                    <button
                      key={m.user_id}
                      onClick={() => setPayers([{ user_id: m.user_id, amount: totalAmount }])}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                        payers[0]?.user_id === m.user_id || (payers.length === 0 && m.user_id === user?.id)
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Avatar color={m.profile.avatar_color} name={m.profile.display_name} size="sm" />
                      <span className="text-sm font-medium text-slate-700">
                        {m.user_id === user?.id ? `${m.profile.display_name} (you)` : m.profile.display_name}
                      </span>
                      {(payers[0]?.user_id === m.user_id || (payers.length === 0 && m.user_id === user?.id)) && (
                        <Check size={16} className="ml-auto text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className={`text-xs font-medium text-right mb-2 ${Math.abs(payerTotal - total) < 0.01 ? "text-emerald-600" : "text-red-500"}`}>
                    Total: {CURRENCY_SYMBOL}{payerTotal.toFixed(2)} / {CURRENCY_SYMBOL}{total.toFixed(2)}
                  </div>
                  {members.map((m) => (
                    <div key={m.user_id} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
                      <Avatar color={m.profile.avatar_color} name={m.profile.display_name} size="sm" />
                      <span className="text-sm font-medium text-slate-700 flex-1">
                        {m.user_id === user?.id ? "You" : m.profile.display_name}
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
                          className="w-full border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                        />
                      </div>
                    </div>
                  ))}
                  {Math.abs(payerTotal - total) > 0.01 && payerTotal > 0 && (
                    <p className="text-xs text-red-500 text-center">
                      Amounts must sum to {CURRENCY_SYMBOL}{total.toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-1">
                Each person will owe <span className="font-semibold text-slate-800">{CURRENCY_SYMBOL}{sharePerPerson.toFixed(2)}</span>
                {" "}({CURRENCY_SYMBOL}{total.toFixed(2)} ÷ {splitCount})
              </p>
              {members.map((m) => (
                <button
                  key={m.user_id}
                  onClick={() => toggleSplitMember(m.user_id)}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${
                    selectedSplitMembers.has(m.user_id)
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    selectedSplitMembers.has(m.user_id) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                  }`}>
                    {selectedSplitMembers.has(m.user_id) && <Check size={10} className="text-white" />}
                  </div>
                  <Avatar color={m.profile.avatar_color} name={m.profile.display_name} size="sm" />
                  <span className="text-sm font-medium text-slate-700 flex-1 text-left">
                    {m.user_id === user?.id ? `${m.profile.display_name} (you)` : m.profile.display_name}
                  </span>
                  {selectedSplitMembers.has(m.user_id) && (
                    <span className="text-xs text-slate-500">{CURRENCY_SYMBOL}{sharePerPerson.toFixed(2)}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Description</span>
                  <span className="text-sm font-semibold text-slate-800">{description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-sm font-bold text-slate-800">{CURRENCY_SYMBOL}{total.toFixed(2)}</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1.5">Paid by</p>
                  {(multiplePayers ? payers.filter((p) => parseFloat(p.amount) > 0) : [payers[0] || { user_id: user!.id, amount: totalAmount }]).map((p) => {
                    const prof = getProfile(p.user_id);
                    return (
                      <div key={p.user_id} className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Avatar color={prof.avatar_color} name={prof.display_name} size="xs" />
                          <span className="text-xs text-slate-700">{p.user_id === user?.id ? "You" : prof.display_name}</span>
                        </div>
                        <span className="text-xs font-medium">{CURRENCY_SYMBOL}{parseFloat(p.amount || totalAmount).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1.5">Split among ({splitCount})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selectedSplitMembers).map((uid) => {
                      const prof = getProfile(uid);
                      return (
                        <div key={uid} className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                          <Avatar color={prof.avatar_color} name={prof.display_name} size="xs" />
                          <span className="text-xs text-slate-700">{uid === user?.id ? "You" : prof.display_name}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{CURRENCY_SYMBOL}{sharePerPerson.toFixed(2)} each</p>
                </div>
                {notes && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Notes</span>
                    <span className="text-sm text-slate-700 italic">{notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex items-center gap-1 border border-slate-200 text-slate-600 font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 ? !canProceedStep1() : step === 2 ? !canProceedStep2() : false}
              className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? "Saving..." : "Add Expense"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
