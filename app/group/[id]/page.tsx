"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Avatar } from "@/components/ui/avatar"
import { formatCurrency, calculateBalances, calculateSettlements } from "@/lib/balance"
import type { Group, Profile, Expense, Repayment, Settlement } from "@/lib/types"
import {
  ArrowLeft,
  Plus,
  Users,
  Receipt,
  Copy,
  Check,
  Loader2,
  Trash2,
  ArrowRightLeft,
} from "lucide-react"
import { toast } from "sonner"
import { AddExpenseModal } from "@/components/add-expense-modal"
import { RecordRepaymentModal } from "@/components/record-repayment-modal"

export default function GroupPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showRecordRepayment, setShowRecordRepayment] = useState(false)
  const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses")

  const fetchData = useCallback(async () => {
    if (!user) return

    setLoading(true)

    // Fetch group
    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()

    if (!groupData) {
      router.push("/dashboard")
      return
    }
    setGroup(groupData)

    // Fetch members
    const { data: memberData } = await supabase
      .from("group_members")
      .select(`
        user_id,
        profiles (*)
      `)
      .eq("group_id", groupId)

    if (memberData) {
      const profiles = memberData
        .map((m) => m.profiles as unknown as Profile)
        .filter((p): p is Profile => p !== null)
      setMembers(profiles)
    }

    // Fetch expenses with payers and splits
    const { data: expenseData } = await supabase
      .from("expenses")
      .select(`
        *,
        profiles (*),
        expense_payers (*, profiles (*)),
        expense_splits (*, profiles (*))
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })

    if (expenseData) {
      setExpenses(expenseData as Expense[])
    }

    // Fetch repayments
    const { data: repaymentData } = await supabase
      .from("repayments")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })

    if (repaymentData) {
      setRepayments(repaymentData)
    }

    setLoading(false)
  }, [user, groupId, router, supabase])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchData()
    }
  }, [user, authLoading, router, fetchData])

  const copyInviteCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Invite code copied!")
    }
  }

  const deleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    const { error } = await supabase.from("expenses").delete().eq("id", expenseId)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("Expense deleted")
    fetchData()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!group) return null

  const balances = calculateBalances(expenses, repayments, members)
  const settlements = calculateSettlements(balances)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{group.name}</h1>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              title="Copy invite code"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="font-mono">{group.invite_code}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Members */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-1.5 shrink-0">
              <Avatar name={member.display_name} color={member.avatar_color} size="sm" />
              <span className="text-sm text-muted-foreground">{member.display_name}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "expenses"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="h-4 w-4 inline-block mr-1.5" />
            Expenses
          </button>
          <button
            onClick={() => setActiveTab("balances")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "balances"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowRightLeft className="h-4 w-4 inline-block mr-1.5" />
            Balances
          </button>
        </div>

        {activeTab === "expenses" ? (
          <>
            {/* Add Expense Button */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card py-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Expense
            </button>

            {/* Expenses List */}
            {expenses.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No expenses yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first expense to start tracking
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    currentUserId={user!.id}
                    groupCreatorId={group.created_by}
                    onDelete={() => deleteExpense(expense.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Balances View */}
            <div className="space-y-6">
              {/* Individual Balances */}
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Individual Balances</h3>
                <div className="space-y-2">
                  {members.map((member) => {
                    const balance = balances[member.id] || 0
                    const isPositive = balance > 0.01
                    const isNegative = balance < -0.01

                    return (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar name={member.display_name} color={member.avatar_color} size="sm" />
                          <span className="text-sm text-foreground">{member.display_name}</span>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isPositive
                              ? "text-green-600"
                              : isNegative
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isPositive && "+"}
                          {formatCurrency(balance)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Suggested Settlements */}
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Suggested Settlements</h3>
                {settlements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All settled up! No payments needed.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((settlement, i) => (
                      <SettlementCard
                        key={i}
                        settlement={settlement}
                        members={members}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Record Repayment */}
              <button
                onClick={() => setShowRecordRepayment(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Record Repayment
              </button>

              {/* Recent Repayments */}
              {repayments.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Recent Repayments</h3>
                  <div className="space-y-2">
                    {repayments.slice(0, 5).map((repayment) => {
                      const payer = members.find((m) => m.id === repayment.paid_by)
                      const receiver = members.find((m) => m.id === repayment.paid_to)

                      return (
                        <div
                          key={repayment.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-foreground">{payer?.display_name}</span>
                            <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{receiver?.display_name}</span>
                          </div>
                          <span className="font-medium text-foreground">
                            {formatCurrency(repayment.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {showAddExpense && (
        <AddExpenseModal
          groupId={groupId}
          members={members}
          currentUserId={user!.id}
          onClose={() => setShowAddExpense(false)}
          onAdded={() => {
            setShowAddExpense(false)
            fetchData()
          }}
        />
      )}

      {showRecordRepayment && (
        <RecordRepaymentModal
          groupId={groupId}
          members={members}
          currentUserId={user!.id}
          onClose={() => setShowRecordRepayment(false)}
          onRecorded={() => {
            setShowRecordRepayment(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function ExpenseCard({
  expense,
  currentUserId,
  groupCreatorId,
  onDelete,
}: {
  expense: Expense
  currentUserId: string
  groupCreatorId: string
  onDelete: () => void
}) {
  const canDelete = expense.created_by === currentUserId || groupCreatorId === currentUserId
  const payers = expense.expense_payers || []
  const splits = expense.expense_splits || []

  const payerNames = payers
    .map((p) => p.profiles?.display_name)
    .filter(Boolean)
    .join(", ")

  const splitCount = splits.length

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-foreground">{expense.description}</h4>
          <p className="text-xs text-muted-foreground">
            Paid by {payerNames} &bull; Split {splitCount} ways
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(expense.total_amount)}
          </span>
          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {expense.notes && (
        <p className="text-sm text-muted-foreground">{expense.notes}</p>
      )}
    </div>
  )
}

function SettlementCard({
  settlement,
  members,
}: {
  settlement: Settlement
  members: Profile[]
}) {
  const from = members.find((m) => m.id === settlement.from)
  const to = members.find((m) => m.id === settlement.to)

  if (!from || !to) return null

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Avatar name={from.display_name} color={from.avatar_color} size="sm" />
        <div>
          <p className="text-sm font-medium text-foreground">{from.display_name}</p>
          <p className="text-xs text-muted-foreground">
            pays {to.display_name}
          </p>
        </div>
      </div>
      <span className="text-base font-semibold text-foreground">
        {formatCurrency(settlement.amount)}
      </span>
    </div>
  )
}
