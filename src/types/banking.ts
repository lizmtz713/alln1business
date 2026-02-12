export type BankAccount = {
  id: string;
  user_id: string;
  account_name: string;
  account_type: string | null;
  bank_name: string | null;
  last_four: string | null;
  current_balance: number | null;
  is_primary: boolean;
  plaid_account_id: string | null;
  created_at: string;
};

export type BankAccountInsert = {
  user_id: string;
  account_name: string;
  account_type?: string | null;
  bank_name?: string | null;
  last_four?: string | null;
  current_balance?: number | null;
  is_primary?: boolean;
};

export type BankAccountUpdate = Partial<Omit<BankAccount, 'id' | 'user_id' | 'created_at'>>;

export type BankStatement = {
  id: string;
  user_id: string;
  bank_account_id: string | null;
  filename: string | null;
  file_url: string | null;
  statement_date: string | null;
  start_date: string | null;
  end_date: string | null;
  starting_balance: number | null;
  ending_balance: number | null;
  total_deposits: number | null;
  total_withdrawals: number | null;
  transaction_count: number;
  reconciled: boolean;
  reconciled_date: string | null;
  created_at: string;
};

export type BankStatementInsert = {
  user_id: string;
  bank_account_id?: string | null;
  filename?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  starting_balance?: number | null;
  ending_balance?: number | null;
  total_deposits?: number | null;
  total_withdrawals?: number | null;
  transaction_count?: number;
};
