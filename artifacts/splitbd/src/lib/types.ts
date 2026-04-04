export interface Profile {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profiles?: Profile;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  total_amount: number;
  created_by: string;
  created_at: string;
  notes: string | null;
  profiles?: Profile;
  expense_payers?: ExpensePayer[];
  expense_splits?: ExpenseSplit[];
}

export interface ExpensePayer {
  id: string;
  expense_id: string;
  user_id: string;
  amount_paid: number;
  profiles?: Profile;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
  profiles?: Profile;
}

export interface Settlement {
  id: string;
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  note: string | null;
  created_at: string;
  payer_profile?: Profile;
  payee_profile?: Profile;
}

export interface SimplifiedDebt {
  from: string;
  fromProfile: Profile;
  to: string;
  toProfile: Profile;
  amount: number;
}

export interface MemberBalance {
  user_id: string;
  profile: Profile;
  netBalance: number;
}
