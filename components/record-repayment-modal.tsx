"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "@/components/ui/avatar"
import { X, Loader2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface RecordRepaymentModalProps {
  groupId: string
  members: Profile[]
  currentUserId: string
  onClose: () => void
  onRecorded: () => void
}

export function RecordRepaymentModal({
  groupId,
  members,
  currentUserId,
  onClose,
  onRecorded,
}: RecordRepaymentModalProps) {
  const [payerId, setPayerId] = useState(currentUserId)
  const [receiverId, setReceiverId] = useState(members.find((m) => m.id !== currentUserId)?.id || "")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountNum = parseFloat(amount)

    if (amountNum <= 0) {
      toast.error("Amount must be greater than 0")
      return
    }

    if (payerId === receiverId) {
      toast.error("Payer and receiver must be different")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("repayments").insert({
        group_id: groupId,
        paid_by: payerId,
        paid_to: receiverId,
        amount: amountNum,
        note: note || null,
      })

      if (error) throw error

      toast.success("Repayment recorded!")
      onRecorded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record repayment")
    } finally {
      setLoading(false)
    }
  }

  const payer = members.find((m) => m.id === payerId)
  const receiver = members.find((m) => m.id === receiverId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-lg">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Record Repayment</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Visual Preview */}
          {payer && receiver && (
            <div className="flex items-center justify-center gap-3 py-4 bg-muted/50 rounded-xl">
              <div className="flex flex-col items-center gap-1">
                <Avatar name={payer.display_name} color={payer.avatar_color} size="lg" />
                <span className="text-xs text-muted-foreground">{payer.display_name}</span>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="h-6 w-6 text-primary" />
                {amount && (
                  <span className="text-sm font-semibold text-primary">
                    ৳{parseFloat(amount).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <Avatar name={receiver.display_name} color={receiver.avatar_color} size="lg" />
                <span className="text-xs text-muted-foreground">{receiver.display_name}</span>
              </div>
            </div>
          )}

          {/* Payer */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Who paid?
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

          {/* Receiver */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Who received?
            </label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {members
                .filter((m) => m.id !== payerId)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name}
                  </option>
                ))}
            </select>
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

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Cash, bKash, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Recording..." : "Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
