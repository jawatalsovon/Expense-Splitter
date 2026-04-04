import type { Expense, Settlement, MemberBalance, SimplifiedDebt, Profile } from "./types";

export function calculateMemberBalances(
  expenses: Expense[],
  settlements: Settlement[],
  members: { user_id: string; profile: Profile }[]
): MemberBalance[] {
  const balanceMap: Record<string, number> = {};

  for (const m of members) {
    balanceMap[m.user_id] = 0;
  }

  for (const expense of expenses) {
    if (!expense.expense_payers || !expense.expense_splits) continue;

    for (const payer of expense.expense_payers) {
      balanceMap[payer.user_id] = (balanceMap[payer.user_id] ?? 0) + payer.amount_paid;
    }

    for (const split of expense.expense_splits) {
      balanceMap[split.user_id] = (balanceMap[split.user_id] ?? 0) - split.share_amount;
    }
  }

  for (const settlement of settlements) {
    balanceMap[settlement.paid_by] = (balanceMap[settlement.paid_by] ?? 0) - settlement.amount;
    balanceMap[settlement.paid_to] = (balanceMap[settlement.paid_to] ?? 0) + settlement.amount;
  }

  return members.map((m) => ({
    user_id: m.user_id,
    profile: m.profile,
    netBalance: Math.round((balanceMap[m.user_id] ?? 0) * 100) / 100,
  }));
}

export function simplifyDebts(balances: MemberBalance[]): SimplifiedDebt[] {
  const creditors: { user_id: string; profile: Profile; amount: number }[] = [];
  const debtors: { user_id: string; profile: Profile; amount: number }[] = [];

  for (const b of balances) {
    if (b.netBalance > 0.01) {
      creditors.push({ user_id: b.user_id, profile: b.profile, amount: b.netBalance });
    } else if (b.netBalance < -0.01) {
      debtors.push({ user_id: b.user_id, profile: b.profile, amount: -b.netBalance });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts: SimplifiedDebt[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.01) {
      debts.push({
        from: debtor.user_id,
        fromProfile: debtor.profile,
        to: creditor.user_id,
        toProfile: creditor.profile,
        amount: Math.round(amount * 100) / 100,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return debts;
}
