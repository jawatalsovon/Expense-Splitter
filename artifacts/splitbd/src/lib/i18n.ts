export type Translations = {
  appName: string;
  logIn: string;
  logOut: string;
  signIn: string;
  signingIn: string;
  signUpFree: string;
  createAccount: string;
  creating: string;
  tagline1: string;
  tagline2: string;
  taglineDesc: string;
  freeBadge: string;
  featureGroups: string;
  featureGroupsDesc: string;
  featureRealtime: string;
  featureRealtimeDesc: string;
  featureSmart: string;
  featureSmartDesc: string;
  backToHome: string;
  welcomeBack: string;
  signInDesc: string;
  email: string;
  password: string;
  noAccount: string;
  createYourAccount: string;
  signupDesc: string;
  displayName: string;
  displayNamePlaceholder: string;
  alreadyHaveAccount: string;
  accountCreatedWelcome: string;
  yourGroups: string;
  noGroupsYet: string;
  noGroupsDesc: string;
  createFirstGroup: string;
  create: string;
  join: string;
  settledUp: string;
  youAreOwed: string;
  youOwe: string;
  member: string;
  members: string;
  createGroup: string;
  groupName: string;
  groupNamePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  cancel: string;
  createGroupBtn: string;
  creatingGroup: string;
  joinGroup: string;
  inviteCode: string;
  inviteCodePlaceholder: string;
  joiningGroup: string;
  joinGroupBtn: string;
  alreadyMember: string;
  invalidCode: string;
  failedCreate: string;
  failedJoin: string;
  balances: string;
  expenses: string;
  membersTab: string;
  memberBalances: string;
  simplifiedSettlements: string;
  you: string;
  youLower: string;
  owes: string;
  markAsPaid: string;
  allSettledUp: string;
  noDebts: string;
  youAreSettled: string;
  noExpensesYet: string;
  noExpensesDesc: string;
  paidBy: string;
  splitAmong: string;
  paid: string;
  yourShare: string;
  deleteExpense: string;
  copyCode: string;
  copied: string;
  shareCode: string;
  groupCreator: string;
  groupNotFound: string;
  backToDashboard: string;
  confirmSettlement: string;
  willPay: string;
  to: string;
  confirm: string;
  deleteExpenseTitle: string;
  deleteExpenseDesc: string;
  delete: string;
  addExpense: string;
  stepLabel: string;
  ofLabel: string;
  basicInfo: string;
  whoPaid: string;
  whoSplits: string;
  confirmStep: string;
  descriptionLabel: string;
  descriptionExpensePlaceholder: string;
  totalAmount: string;
  notesLabel: string;
  notesPlaceholder: string;
  singlePayer: string;
  multiplePayers: string;
  eachPersonOwes: string;
  paidByLabel: string;
  splitAmongLabel: string;
  each: string;
  notesKey: string;
  back: string;
  continueBtn: string;
  saving: string;
  addExpenseBtn: string;
  recordRepayment: string;
  repaymentNote: string;
  repaymentNotePlaceholder: string;
  repaymentHistory: string;
  noRepayments: string;
  newExpenseAdded: string;
  settlementRecorded: string;
  repaymentRecordedEvent: string;
  groupsCount: (n: number) => string;
  membersCount: (n: number) => string;
  groupCreatedMsg: (name: string) => string;
  joinedMsg: (name: string) => string;
  settledAmountMsg: (amount: string) => string;
  expenseAddedMsg: (desc: string) => string;
  amountsMustSumMsg: (amount: string) => string;
  repaymentRecordedMsg: (amount: string) => string;
  youAreOwedOverall: (amount: string) => string;
  youOweOverall: (amount: string) => string;
  willPayAmount: (payer: string, amount: string, payee: string) => string;
};

export const en: Translations = {
  appName: "Hisab",
  logIn: "Log In",
  logOut: "Log Out",
  signIn: "Sign In",
  signingIn: "Signing in...",
  signUpFree: "Sign up free",
  createAccount: "Create Account",
  creating: "Creating...",
  tagline1: "Split expenses.",
  tagline2: "Not friendships.",
  taglineDesc: "Track shared expenses with friends, family, and roommates. See who owes what, settle up instantly, and keep things fair — always.",
  freeBadge: "Free to use, no credit card required",
  featureGroups: "Group Expense Tracking",
  featureGroupsDesc: "Create groups for trips, households, or events. Add expenses with flexible split options.",
  featureRealtime: "Real-Time Sync",
  featureRealtimeDesc: "Everyone in the group sees updates instantly. No refresh needed, no confusion.",
  featureSmart: "Smart Settlement",
  featureSmartDesc: "Our algorithm calculates the minimum number of payments to zero out all debts.",
  backToHome: "← Back to home",
  welcomeBack: "Welcome back",
  signInDesc: "Sign in to your account",
  email: "Email",
  password: "Password",
  noAccount: "Don't have an account?",
  createYourAccount: "Create your account",
  signupDesc: "Free forever, no credit card needed",
  displayName: "Display Name",
  displayNamePlaceholder: "Your name",
  alreadyHaveAccount: "Already have an account?",
  accountCreatedWelcome: "Account created! Welcome to Hisab.",
  yourGroups: "Your Groups",
  noGroupsYet: "No groups yet",
  noGroupsDesc: "Create a group or join one with an invite code.",
  createFirstGroup: "Create your first group",
  create: "Create",
  join: "Join",
  settledUp: "Settled up",
  youAreOwed: "you are owed",
  youOwe: "you owe",
  member: "member",
  members: "members",
  createGroup: "Create Group",
  groupName: "Group Name *",
  groupNamePlaceholder: "e.g. Flat 4B, Thailand Trip",
  description: "Description (optional)",
  descriptionPlaceholder: "What's this group for?",
  cancel: "Cancel",
  createGroupBtn: "Create Group",
  creatingGroup: "Creating...",
  joinGroup: "Join Group",
  inviteCode: "Invite Code",
  inviteCodePlaceholder: "e.g. AB12CD34",
  joiningGroup: "Joining...",
  joinGroupBtn: "Join Group",
  alreadyMember: "You're already a member of this group.",
  invalidCode: "Invalid invite code. Please check and try again.",
  failedCreate: "Failed to create group",
  failedJoin: "Failed to join group",
  balances: "Balances",
  expenses: "Expenses",
  membersTab: "Members",
  memberBalances: "Member Balances",
  simplifiedSettlements: "Simplified Settlements",
  you: "You",
  youLower: "you",
  owes: "owes",
  markAsPaid: "Mark as Paid",
  allSettledUp: "All settled up!",
  noDebts: "No outstanding debts in this group.",
  youAreSettled: "You are all settled up",
  noExpensesYet: "No expenses yet",
  noExpensesDesc: "Add the first expense for this group.",
  paidBy: "PAID BY",
  splitAmong: "SPLIT AMONG",
  paid: "paid",
  yourShare: "your share",
  deleteExpense: "Delete expense",
  copyCode: "Copy",
  copied: "Copied!",
  shareCode: "Share this code to invite people",
  groupCreator: "Group creator",
  groupNotFound: "Group not found.",
  backToDashboard: "Back to Dashboard",
  confirmSettlement: "Confirm Repayment",
  willPay: "will pay",
  to: "to",
  confirm: "Confirm",
  deleteExpenseTitle: "Delete Expense?",
  deleteExpenseDesc: "This will permanently remove the expense and recalculate all balances.",
  delete: "Delete",
  addExpense: "Add Expense",
  stepLabel: "Step",
  ofLabel: "of",
  basicInfo: "Basic Info",
  whoPaid: "Who Paid?",
  whoSplits: "Who Splits?",
  confirmStep: "Confirm",
  descriptionLabel: "Description *",
  descriptionExpensePlaceholder: "e.g. Dinner, Bus fare, Groceries",
  totalAmount: "Total Amount *",
  notesLabel: "Notes (optional)",
  notesPlaceholder: "Any extra details...",
  singlePayer: "Single Payer",
  multiplePayers: "Multiple Payers",
  eachPersonOwes: "Each person will owe",
  paidByLabel: "Paid by",
  splitAmongLabel: "Split among",
  each: "each",
  notesKey: "Notes",
  back: "Back",
  continueBtn: "Continue",
  saving: "Saving...",
  addExpenseBtn: "Add Expense",
  recordRepayment: "Confirm Repayment",
  repaymentNote: "Note (optional)",
  repaymentNotePlaceholder: "e.g. Cash, bKash, Nagad...",
  repaymentHistory: "Repayment History",
  noRepayments: "No repayments recorded yet.",
  newExpenseAdded: "A new expense was added",
  settlementRecorded: "A settlement was recorded",
  repaymentRecordedEvent: "A repayment was recorded",
  groupsCount: (n) => `${n} group${n !== 1 ? "s" : ""}`,
  membersCount: (n) => `${n} member${n !== 1 ? "s" : ""}`,
  groupCreatedMsg: (name) => `Group "${name}" created!`,
  joinedMsg: (name) => `Joined "${name}"!`,
  settledAmountMsg: (amount) => `Repayment of ${amount} recorded!`,
  expenseAddedMsg: (desc) => `Expense "${desc}" added!`,
  amountsMustSumMsg: (amount) => `Amounts must sum to ${amount}`,
  repaymentRecordedMsg: (amount) => `Repayment of ${amount} recorded!`,
  youAreOwedOverall: (amount) => `You are owed ${amount} overall`,
  youOweOverall: (amount) => `You owe ${amount} overall`,
  willPayAmount: (payer, amount, payee) => `${payer} will pay ${amount} to ${payee}.`,
};

export const bn: Translations = {
  appName: "হিসাব",
  logIn: "লগ ইন",
  logOut: "লগ আউট",
  signIn: "সাইন ইন",
  signingIn: "লগইন হচ্ছে...",
  signUpFree: "বিনামূল্যে সাইন আপ",
  createAccount: "অ্যাকাউন্ট তৈরি করুন",
  creating: "তৈরি হচ্ছে...",
  tagline1: "খরচ ভাগ করুন।",
  tagline2: "বন্ধুত্ব নয়।",
  taglineDesc: "বন্ধু, পরিবার ও রুমমেটের সাথে যৌথ খরচ ট্র্যাক করুন। কে কতটা দেনা — একনজরে দেখুন এবং সহজেই মিটিয়ে নিন।",
  freeBadge: "বিনামূল্যে, কার্ড লাগবে না",
  featureGroups: "গ্রুপ খরচ ট্র্যাকিং",
  featureGroupsDesc: "ভ্রমণ, পরিবার বা ইভেন্টের জন্য গ্রুপ তৈরি করুন। নমনীয় বিভাজন বিকল্পসহ খরচ যোগ করুন।",
  featureRealtime: "রিয়েল-টাইম আপডেট",
  featureRealtimeDesc: "গ্রুপের সবাই তাৎক্ষণিকভাবে আপডেট দেখতে পান। রিফ্রেশ নয়, বিভ্রান্তি নয়।",
  featureSmart: "স্মার্ট হিসাব",
  featureSmartDesc: "আমাদের অ্যালগরিদম সর্বনিম্ন লেনদেনে সব দেনা মিটিয়ে দেয়।",
  backToHome: "← হোমে ফিরুন",
  welcomeBack: "স্বাগত",
  signInDesc: "আপনার অ্যাকাউন্টে সাইন ইন করুন",
  email: "ইমেইল",
  password: "পাসওয়ার্ড",
  noAccount: "অ্যাকাউন্ট নেই?",
  createYourAccount: "অ্যাকাউন্ট তৈরি করুন",
  signupDesc: "সম্পূর্ণ বিনামূল্যে, কার্ড লাগবে না",
  displayName: "প্রদর্শনী নাম",
  displayNamePlaceholder: "আপনার নাম",
  alreadyHaveAccount: "আগে থেকেই অ্যাকাউন্ট আছে?",
  accountCreatedWelcome: "অ্যাকাউন্ট তৈরি হয়েছে! হিসাবে স্বাগতম।",
  yourGroups: "আপনার গ্রুপসমূহ",
  noGroupsYet: "এখনো কোনো গ্রুপ নেই",
  noGroupsDesc: "একটি গ্রুপ তৈরি করুন বা আমন্ত্রণ কোড দিয়ে যোগ দিন।",
  createFirstGroup: "প্রথম গ্রুপ তৈরি করুন",
  create: "তৈরি করুন",
  join: "যোগ দিন",
  settledUp: "পরিশোধিত",
  youAreOwed: "আপনাকে দেবে",
  youOwe: "আপনি দেবেন",
  member: "সদস্য",
  members: "সদস্য",
  createGroup: "গ্রুপ তৈরি করুন",
  groupName: "গ্রুপের নাম *",
  groupNamePlaceholder: "যেমন: ফ্ল্যাট ৪বি, থাইল্যান্ড ট্রিপ",
  description: "বিবরণ (ঐচ্ছিক)",
  descriptionPlaceholder: "এই গ্রুপটি কিসের জন্য?",
  cancel: "বাতিল",
  createGroupBtn: "গ্রুপ তৈরি করুন",
  creatingGroup: "তৈরি হচ্ছে...",
  joinGroup: "গ্রুপে যোগ দিন",
  inviteCode: "আমন্ত্রণ কোড",
  inviteCodePlaceholder: "যেমন: AB12CD34",
  joiningGroup: "যোগ দেওয়া হচ্ছে...",
  joinGroupBtn: "যোগ দিন",
  alreadyMember: "আপনি ইতিমধ্যে এই গ্রুপের সদস্য।",
  invalidCode: "ভুল আমন্ত্রণ কোড। আবার চেষ্টা করুন।",
  failedCreate: "গ্রুপ তৈরি করা যায়নি",
  failedJoin: "গ্রুপে যোগ দেওয়া যায়নি",
  balances: "ব্যালেন্স",
  expenses: "খরচ",
  membersTab: "সদস্য",
  memberBalances: "সদস্যদের ব্যালেন্স",
  simplifiedSettlements: "সরলীকৃত হিসাব",
  you: "আপনি",
  youLower: "আপনাকে",
  owes: "দেনা",
  markAsPaid: "পরিশোধিত করুন",
  allSettledUp: "সব হিসাব পরিষদ্ধ! 🎉",
  noDebts: "এই গ্রুপে কোনো বকেয়া নেই।",
  youAreSettled: "আপনার সব হিসাব পরিষদ্ধ",
  noExpensesYet: "এখনো কোনো খরচ নেই",
  noExpensesDesc: "এই গ্রুপের প্রথম খরচ যোগ করুন।",
  paidBy: "পরিশোধ করেছেন",
  splitAmong: "ভাগ করা হয়েছে",
  paid: "পরিশোধ করেছেন",
  yourShare: "আপনার অংশ",
  deleteExpense: "খরচ মুছুন",
  copyCode: "কপি",
  copied: "কপি হয়েছে!",
  shareCode: "মানুষকে আমন্ত্রণ জানাতে কোডটি শেয়ার করুন",
  groupCreator: "গ্রুপ প্রশাসক",
  groupNotFound: "গ্রুপ পাওয়া যায়নি।",
  backToDashboard: "ড্যাশবোর্ডে ফিরুন",
  confirmSettlement: "পরিশোধ নিশ্চিত করুন",
  willPay: "পরিশোধ করবেন",
  to: "কে",
  confirm: "নিশ্চিত করুন",
  deleteExpenseTitle: "খরচ মুছবেন?",
  deleteExpenseDesc: "এটি খরচটি স্থায়ীভাবে মুছে ফেলবে এবং সব ব্যালেন্স পুনরায় গণনা করবে।",
  delete: "মুছুন",
  addExpense: "খরচ যোগ করুন",
  stepLabel: "ধাপ",
  ofLabel: "এর",
  basicInfo: "মূল তথ্য",
  whoPaid: "কে পরিশোধ করেছেন?",
  whoSplits: "কারা ভাগ করবেন?",
  confirmStep: "নিশ্চিত করুন",
  descriptionLabel: "বিবরণ *",
  descriptionExpensePlaceholder: "যেমন: রাতের খাবার, বাস ভাড়া, মুদি বাজার",
  totalAmount: "মোট পরিমাণ *",
  notesLabel: "নোট (ঐচ্ছিক)",
  notesPlaceholder: "অতিরিক্ত তথ্য...",
  singlePayer: "একজন পরিশোধকারী",
  multiplePayers: "একাধিক পরিশোধকারী",
  eachPersonOwes: "প্রত্যেকে দেবেন",
  paidByLabel: "পরিশোধকারী",
  splitAmongLabel: "ভাগ করা হবে",
  each: "প্রতিজন",
  notesKey: "নোট",
  back: "পেছনে",
  continueBtn: "এগিয়ে যান",
  saving: "সংরক্ষণ হচ্ছে...",
  addExpenseBtn: "খরচ যোগ করুন",
  recordRepayment: "পরিশোধ নিশ্চিত করুন",
  repaymentNote: "নোট (ঐচ্ছিক)",
  repaymentNotePlaceholder: "যেমন: নগদ, বিকাশ, নগদ...",
  repaymentHistory: "পরিশোধের ইতিহাস",
  noRepayments: "এখনো কোনো পরিশোধ নেই।",
  newExpenseAdded: "নতুন খরচ যোগ হয়েছে",
  settlementRecorded: "হিসাব লিপিবদ্ধ হয়েছে",
  repaymentRecordedEvent: "পরিশোধ লিপিবদ্ধ হয়েছে",
  groupsCount: (n) => `${n}টি গ্রুপ`,
  membersCount: (n) => `${n} জন সদস্য`,
  groupCreatedMsg: (name) => `"${name}" গ্রুপ তৈরি হয়েছে!`,
  joinedMsg: (name) => `"${name}" গ্রুপে যোগ দেওয়া হয়েছে!`,
  settledAmountMsg: (amount) => `${amount} পরিশোধ লিপিবদ্ধ হয়েছে!`,
  expenseAddedMsg: (desc) => `"${desc}" খরচ যোগ হয়েছে!`,
  amountsMustSumMsg: (amount) => `মোট ${amount} হতে হবে`,
  repaymentRecordedMsg: (amount) => `${amount} পরিশোধ লিপিবদ্ধ হয়েছে!`,
  youAreOwedOverall: (amount) => `আপনাকে মোট ${amount} দেওয়া হবে`,
  youOweOverall: (amount) => `আপনি মোট ${amount} দেবেন`,
  willPayAmount: (payer, amount, payee) => `${payer} ${amount} পরিশোধ করবেন ${payee} কে।`,
};
