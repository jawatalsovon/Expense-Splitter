"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/ui/avatar"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface AddExpenseModalProps {
  groupId: string
  members: Profile[]
  currentUserId: string
  onClose: () => void
  onAdded: () => void
}

type SplitType = "equal" | "custom"

export function AddExpenseModal({
  groupId,
  members,
  currentUserId,
  onClose,
  onAdded,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [payerId, setPayerId] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>("equal")
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map((m) => m.id))
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const totalAmount = parseFloat(amount) || 0

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
      }
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const getEqualSplit = () => {
    if (selectedMembers.length === 0) return 0
    return totalAmount / selectedMembers.length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (totalAmount <= 0) {
      toast.error("Amount must be greater than 0")
      return
    }

    if (selectedMembers.length === 0) {
      toast.error("Select at least one member to split with")
      return
    }

    setLoading(true)

    try {
      // Create expense
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          group_id: groupId,
          description,
          total_amount: totalAmount,
          created_by: currentUserId,
          notes: notes || null,
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Add payer
      const { error: payerError } = await supabase
        .from("expense_payers")
        .insert({
          expense_id: expense.id,
          user_id: payerId,
          amount_paid: totalAmount,
        })

      if (payerError) throw payerError

      // Add splits
      const splits = selectedMembers.map((memberId) => {
        let shareAmount: number

        if (splitType === "custom") {
          shareAmount = parseFloat(customSplits[memberId] || "0")
        } else {
          shareAmount = getEqualSplit()
        }

        return {
          expense_id: expense.id,
          user_id: memberId,
          share_amount: shareAmount,
        }
      })

      const { error: splitsError } = await supabase.from("expense_splits").insert(splits)

      if (splitsError) throw splitsError

      toast.success("Expense added!")
      onAdded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add expense")
    } finally {
      setLoading(false)
    }
  }

  const customTotal = Object.values(customSplits).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  )
  const customDiff = totalAmount - customTotal

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-foreground">Add Expense</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Dinner, groceries, etc."
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Amount (BDT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Paid by
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Split Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Split type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitType("equal")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  splitType === "equal"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitType("custom")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  splitType === "custom"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Members to split with */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Split with
            </label>
            <div className="space-y-2">
              {members.map((member) => {
                const isSelected = selectedMembers.includes(member.id)
                const equalShare = getEqualSplit()

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(member.id)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                      />
                      <Avatar
                        name={member.display_name}
                        color={member.avatar_color}
                        size="sm"
                      />
                      <span className="text-sm text-foreground">{member.display_name}</span>
                    </label>
                    {isSelected && splitType === "equal" && (
                      <span className="text-sm font-medium text-muted-foreground">
                        ৳{equalShare.toFixed(2)}
                      </span>
                    )}
                    {isSelected && splitType === "custom" && (
                      <input
                        type="number"
                        value={customSplits[member.id] || ""}
                        onChange={(e) =>
                          setCustomSplits({ ...customSplits, [member.id]: e.target.value })
                        }
                        className="w-24 rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {splitType === "custom" && (
              <p
                className={`text-xs mt-2 ${
                  Math.abs(customDiff) < 0.01 ? "text-green-600" : "text-amber-500"
                }`}
              >
                {Math.abs(customDiff) < 0.01
                  ? "Splits match total"
                  : customDiff > 0
                  ? `৳${customDiff.toFixed(2)} remaining to assign`
                  : `৳${Math.abs(customDiff).toFixed(2)} over the total`}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Additional details..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !description || totalAmount <= 0}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  )
}
