export type Owner = "남편" | "아내" | "공동";
export type TransactionType = "카드" | "계좌" | "현금";

export type Transaction = {
  id: string;
  date: string;
  owner: Owner;
  type: TransactionType;
  account: string;
  merchant: string;
  category: string;
  amount: number;
  memo: string;
};

export type Account = {
  owner: Owner;
  name: string;
  bank: string;
  balance: number;
  status: string;
};

export type NamedAmount = {
  name: string;
  amount: number;
};

export function getTotalBalance(accounts: Account[]) {
  return accounts.reduce((total, account) => total + account.balance, 0);
}

export function getTotalSpending(transactions: Transaction[]) {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

export function getScheduledCardPayment(transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.type === "카드")
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function groupTransactionsByCategory(transactions: Transaction[]): NamedAmount[] {
  const grouped = transactions.reduce<Record<string, number>>((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function groupTransactionsByOwner(transactions: Transaction[]): NamedAmount[] {
  const owners: Owner[] = ["남편", "아내", "공동"];

  return owners.map((owner) => ({
    name: owner,
    amount: transactions
      .filter((transaction) => transaction.owner === owner)
      .reduce((total, transaction) => total + transaction.amount, 0)
  }));
}

export function getWeeklyFlow(transactions: Transaction[]) {
  return transactions
    .reduce<Record<string, number>>((acc, transaction) => {
      acc[transaction.date] = (acc[transaction.date] ?? 0) + transaction.amount;
      return acc;
    }, {});
}
