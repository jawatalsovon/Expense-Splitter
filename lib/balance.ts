import type { Expense, Repayment, Balance, Settlement, Profile } from "./types"

export function calculateBalances(
  expenses: Expense[],
  repayments: Repayment[],
  members: Profile[]
): Balance {
  const balances: Balance = {}

  // Initialize balances for all members
  members.forEach((member) => {
    balances[member.id] = 0
  })

  // Process expenses
  expenses.forEach((expense) => {
    const payers = expense.expense_payers || []
    const splits = expense.expense_splits || []

    // Add what each person paid
    payers.forEach((payer) => {
      if (balances[payer.user_id] !== undefined) {
        balances[payer.user_id] += Number(payer.amount_paid)
      }
    })

    // Subtract what each person owes
    splits.forEach((split) => {
      if (balances[split.user_id] !== undefined) {
        balances[split.user_id] -= Number(split.share_amount)
      }
    })
  })

  // Process repayments
  repayments.forEach((repayment) => {
    const amount = Number(repayment.amount)
    if (balances[repayment.paid_by] !== undefined) {
      balances[repayment.paid_by] += amount
    }
    if (balances[repayment.paid_to] !== undefined) {
      balances[repayment.paid_to] -= amount
    }
  })

  return balances
}

export function calculateSettlements(balances: Balance): Settlement[] {
  const settlements: Settlement[] = []

  // Split into debtors (negative balance) and creditors (positive balance)
  const debtors: { id: string; amount: number }[] = []
  const creditors: { id: string; amount: number }[] = []

  Object.entries(balances).forEach(([userId, balance]) => {
    const roundedBalance = Math.round(balance * 100) / 100
    if (roundedBalance < -0.01) {
      debtors.push({ id: userId, amount: Math.abs(roundedBalance) })
    } else if (roundedBalance > 0.01) {
      creditors.push({ id: userId, amount: roundedBalance })
    }
  })

  // Sort by amount descending for optimal settlement
  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  // Match debtors with creditors
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]

    const amount = Math.min(debtor.amount, creditor.amount)
    const roundedAmount = Math.round(amount * 100) / 100

    if (roundedAmount > 0) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount: roundedAmount,
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return settlements
}

export function formatCurrency(amount: number, currency: string = "BDT"): string {
  if (currency === "BDT") {
    return `৳${amount.toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}
