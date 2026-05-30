"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudUpload,
  CreditCard,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  Landmark,
  Pencil,
  Plug,
  Plus,
  RotateCcw,
  Save,
  Send,
  Trash2,
  TrendingUp,
  Wallet,
  X
} from "lucide-react";
import type {
  Account,
  Budget,
  Owner,
  Transaction,
  TransactionType
} from "../lib/finance/summary";
import {
  getScheduledCardPayment,
  getTotalBalance,
  getTotalSpending,
  getWeeklyFlow,
  groupTransactionsByCategory,
  groupTransactionsByOwner
} from "../lib/finance/summary";

const initialTransactions: Transaction[] = [
  {
    id: "tx-001",
    date: "2026-05-10",
    owner: "남편",
    type: "카드",
    account: "국민카드",
    merchant: "주유소",
    category: "교통",
    amount: 68400,
    memo: "주말 이동 주유"
  },
  {
    id: "tx-002",
    date: "2026-05-11",
    owner: "아내",
    type: "카드",
    account: "삼성카드",
    merchant: "소아과",
    category: "육아/의료",
    amount: 18700,
    memo: "정기 진료"
  },
  {
    id: "tx-003",
    date: "2026-05-12",
    owner: "공동",
    type: "카드",
    account: "생활비카드",
    merchant: "이마트",
    category: "생활/마트",
    amount: 52000,
    memo: "주중 장보기"
  },
  {
    id: "tx-004",
    date: "2026-05-13",
    owner: "공동",
    type: "계좌",
    account: "생활비통장",
    merchant: "관리비",
    category: "주거",
    amount: 180000,
    memo: "5월 관리비"
  },
  {
    id: "tx-005",
    date: "2026-05-14",
    owner: "남편",
    type: "카드",
    account: "국민카드",
    merchant: "카페",
    category: "카페/간식",
    amount: 12800,
    memo: "외근 중 간식"
  },
  {
    id: "tx-006",
    date: "2026-05-15",
    owner: "아내",
    type: "카드",
    account: "현대카드",
    merchant: "쿠팡",
    category: "생활/마트",
    amount: 34200,
    memo: "생활용품"
  },
  {
    id: "tx-007",
    date: "2026-05-16",
    owner: "공동",
    type: "카드",
    account: "생활비카드",
    merchant: "동네마트",
    category: "식비",
    amount: 62400,
    memo: "주말 식재료"
  }
];

const initialAccounts: Account[] = [
  {
    id: "acct-001",
    owner: "남편",
    name: "급여통장",
    bank: "국민은행",
    balance: 4120000,
    status: "API 예정",
    memo: "월급 입금 계좌"
  },
  {
    id: "acct-002",
    owner: "아내",
    name: "생활통장",
    bank: "카카오뱅크",
    balance: 3100000,
    status: "API 예정",
    memo: "생활비 보조 계좌"
  },
  {
    id: "acct-003",
    owner: "공동",
    name: "공동생활비",
    bank: "토스뱅크",
    balance: 1200000,
    status: "수기 입력",
    memo: "부부 공용 생활비"
  }
];

const initialBudgets: Budget[] = [
  {
    id: "budget-001",
    category: "식비",
    monthlyLimit: 500000,
    memo: "외식과 장보기 식재료"
  },
  {
    id: "budget-002",
    category: "생활/마트",
    monthlyLimit: 400000,
    memo: "생활용품과 마트"
  },
  {
    id: "budget-003",
    category: "카페/간식",
    monthlyLimit: 150000,
    memo: "커피와 간식"
  },
  {
    id: "budget-004",
    category: "교통",
    monthlyLimit: 250000,
    memo: "주유와 대중교통"
  },
  {
    id: "budget-005",
    category: "육아/의료",
    monthlyLimit: 300000,
    memo: "병원, 약국, 아이 관련 지출"
  },
  {
    id: "budget-006",
    category: "주거",
    monthlyLimit: 700000,
    memo: "관리비와 주거 고정비"
  },
  {
    id: "budget-007",
    category: "기타",
    monthlyLimit: 200000,
    memo: "분류 전 기타 지출"
  }
];

const chartColors = ["#2563eb", "#14b8a6", "#f97316", "#db2777", "#64748b", "#16a34a"];
const ownerOptions: Owner[] = ["남편", "아내", "공동"];
const typeOptions: TransactionType[] = ["카드", "계좌", "현금"];
const tabItems = [
  { id: "overview", label: "개요" },
  { id: "transactions", label: "거래/메모" },
  { id: "integrations", label: "연동 준비" }
] as const;
const SAMPLE_BASE_DATE = "2026-05-16";
const STORAGE_KEYS = {
  transactions: "couple-finance-dashboard.transactions.v1",
  periodMemo: "couple-finance-dashboard.periodMemo.v1",
  accounts: "couple-finance-dashboard.accounts.v1",
  budgets: "couple-finance-dashboard.budgets.v1",
  syncPin: "couple-finance-dashboard.syncPin.v1",
  cloudLastSaveAt: "couple-finance-dashboard.cloudLastSaveAt.v1",
  cloudLastLoadAt: "couple-finance-dashboard.cloudLastLoadAt.v1"
} as const;
const DEFAULT_PERIOD_MEMO =
  "이번 기간은 주거비와 생활/마트 지출이 컸다. 다음 기간은 식비 예산을 먼저 확인하고 장보기 횟수를 줄여보기.";
const periodOptions = [
  { type: "week", label: "주간" },
  { type: "month", label: "월간" },
  { type: "year", label: "년간" },
  { type: "custom", label: "직접설정" }
] as const;

type TabId = (typeof tabItems)[number]["id"];
type PeriodType = "week" | "month" | "year" | "custom";

type PeriodFilter = {
  periodType: PeriodType;
  startDate: string;
  endDate: string;
};

type TelegramSendResponse = {
  ok: boolean;
  message: string;
};

type CloudSyncSnapshotData = {
  accounts: Account[];
  budgets: Budget[];
  periodMemo: string;
  transactions: Transaction[];
};

type CloudSyncResponse = {
  data?: unknown;
  message?: string;
  ok: boolean;
  updatedAt?: string;
};

type DraftTransaction = {
  date: string;
  owner: Owner;
  type: TransactionType;
  account: string;
  merchant: string;
  category: string;
  amount: string;
  memo: string;
};

type AccountDraft = {
  owner: Owner;
  name: string;
  bank: string;
  balance: string;
  status: string;
  memo: string;
};

type AccountFormMode = "idle" | "add" | "edit";

type BudgetDraft = {
  category: string;
  monthlyLimit: string;
  memo: string;
};

type BudgetFormMode = "idle" | "add" | "edit";

type BudgetUsageRow = {
  id: string;
  category: string;
  spent: number;
  monthlyLimit: number | null;
  memo: string;
  usageRate: number | null;
  status: "safe" | "warning" | "over" | "unset";
};

type ParsedNotificationSuccess = {
  line: string;
  status: "parsed";
  date: string;
  time: string;
  owner: Owner;
  type: "카드";
  account: string;
  merchant: string;
  category: string;
  amount: number;
  memo: string;
  duplicate: boolean;
};

type ParsedNotificationIssue = {
  line: string;
  reason: string;
  status: "failed" | "cancelled" | "ignored";
};

type ParsedNotificationRow = ParsedNotificationSuccess | ParsedNotificationIssue;

type ParsedCsvSuccess = {
  rowNumber: number;
  status: "parsed";
  date: string;
  owner: Owner;
  type: "카드";
  account: string;
  merchant: string;
  category: string;
  amount: number;
  memo: string;
  duplicate: boolean;
};

type ParsedCsvIssue = {
  raw: string;
  reason: string;
  rowNumber: number;
  status: "failed";
};

type ParsedCsvRow = ParsedCsvSuccess | ParsedCsvIssue;

type BackupCsvAction = "add" | "duplicate";

type ParsedBackupCsvSuccess = {
  rowNumber: number;
  status: "parsed";
  action: BackupCsvAction;
  transaction: Transaction;
};

type ParsedBackupCsvIssue = {
  raw: string;
  reason: string;
  rowNumber: number;
  status: "failed";
};

type ParsedBackupCsvRow = ParsedBackupCsvSuccess | ParsedBackupCsvIssue;

const backupCsvColumns = [
  "id",
  "date",
  "owner",
  "type",
  "account",
  "merchant",
  "category",
  "amount",
  "memo"
] as const;

const emptyDraft: DraftTransaction = {
  date: SAMPLE_BASE_DATE,
  owner: "공동",
  type: "카드",
  account: "생활비카드",
  merchant: "",
  category: "식비",
  amount: "",
  memo: ""
};

const emptyAccountDraft: AccountDraft = {
  owner: "공동",
  name: "",
  bank: "",
  balance: "",
  status: "수기 입력",
  memo: ""
};

const emptyBudgetDraft: BudgetDraft = {
  category: "",
  monthlyLimit: "",
  memo: ""
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatKRW(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function shortDate(date: string) {
  return date.slice(5).replace("-", "/");
}

function formatPeriodDate(date: string) {
  return date.replaceAll("-", ".");
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "없음";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "없음";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getPresetDateRange(periodType: Exclude<PeriodType, "custom">) {
  const baseDate = toDate(SAMPLE_BASE_DATE);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  if (periodType === "week") {
    const day = baseDate.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = addDays(baseDate, mondayOffset);
    const end = addDays(start, 6);

    return {
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(end)
    };
  }

  if (periodType === "month") {
    return {
      startDate: toDateInputValue(new Date(year, month, 1)),
      endDate: toDateInputValue(new Date(year, month + 1, 0))
    };
  }

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`
  };
}

function normalizeDateRange(startDate: string, endDate: string) {
  return startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate };
}

function getPeriodSpendingLabel(periodType: PeriodType) {
  if (periodType === "week") {
    return "주간 지출";
  }

  if (periodType === "month") {
    return "월간 지출";
  }

  if (periodType === "year") {
    return "년간 지출";
  }

  return "선택 기간 지출";
}

function getPeriodLabel(periodType: PeriodType) {
  return periodOptions.find((option) => option.type === periodType)?.label ?? "직접설정";
}

function getReportPeriodLabel(periodType: PeriodType) {
  return periodType === "custom" ? "선택 기간" : getPeriodLabel(periodType);
}

const defaultPeriodFilter: PeriodFilter = {
  periodType: "week",
  ...getPresetDateRange("week")
};

function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Transaction>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.date === "string" &&
    ["남편", "아내", "공동"].includes(candidate.owner ?? "") &&
    ["카드", "계좌", "현금"].includes(candidate.type ?? "") &&
    typeof candidate.account === "string" &&
    typeof candidate.merchant === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount) &&
    typeof candidate.memo === "string"
  );
}

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Account>;

  return (
    typeof candidate.id === "string" &&
    ["남편", "아내", "공동"].includes(candidate.owner ?? "") &&
    typeof candidate.name === "string" &&
    typeof candidate.bank === "string" &&
    typeof candidate.balance === "number" &&
    Number.isFinite(candidate.balance) &&
    typeof candidate.status === "string" &&
    (candidate.memo === undefined || typeof candidate.memo === "string")
  );
}

function isBudget(value: unknown): value is Budget {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Budget>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.monthlyLimit === "number" &&
    Number.isFinite(candidate.monthlyLimit) &&
    candidate.monthlyLimit >= 0 &&
    typeof candidate.memo === "string"
  );
}

function parseStoredTransactions(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(isTransaction) ? parsed : null;
  } catch {
    return null;
  }
}

function parseStoredAccounts(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(isAccount) ? parsed : null;
  } catch {
    return null;
  }
}

function parseStoredBudgets(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(isBudget) ? parsed : null;
  } catch {
    return null;
  }
}

function isCloudSyncSnapshotData(value: unknown): value is CloudSyncSnapshotData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CloudSyncSnapshotData>;

  return (
    Array.isArray(candidate.transactions) &&
    candidate.transactions.every(isTransaction) &&
    Array.isArray(candidate.accounts) &&
    candidate.accounts.every(isAccount) &&
    Array.isArray(candidate.budgets) &&
    candidate.budgets.every(isBudget) &&
    typeof candidate.periodMemo === "string"
  );
}

function parseStoredMemo(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function getTransactionKey({
  account,
  amount,
  date,
  merchant
}: Pick<Transaction, "account" | "amount" | "date" | "merchant">) {
  return `${date}|${account.trim()}|${merchant.trim()}|${amount}`;
}

function inferNotificationOwner(account: string): Owner {
  if (account.includes("국민카드")) {
    return "남편";
  }

  if (account.includes("삼성카드") || account.includes("현대카드")) {
    return "아내";
  }

  if (account.includes("생활비카드")) {
    return "공동";
  }

  return "공동";
}

function inferNotificationCategory(merchant: string) {
  const rules = [
    { category: "생활/마트", keywords: ["이마트", "마트", "쿠팡", "다이소"] },
    { category: "교통", keywords: ["주유", "주유소", "GS칼텍스", "SK에너지", "S-OIL"] },
    { category: "카페/간식", keywords: ["카페", "스타벅스", "투썸", "메가커피", "컴포즈"] },
    { category: "육아/의료", keywords: ["병원", "의원", "약국", "소아과"] },
    { category: "식비", keywords: ["배민", "요기요", "식당", "음식점", "김밥", "치킨", "피자"] },
    { category: "주거", keywords: ["관리비", "아파트", "전기", "가스", "수도"] }
  ];

  return (
    rules.find((rule) => rule.keywords.some((keyword) => merchant.includes(keyword)))?.category ??
    "기타"
  );
}

function formatNotificationDate(month: number, day: number) {
  return `${SAMPLE_BASE_DATE.slice(0, 4)}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(
    2,
    "0"
  )}`;
}

function isValidNotificationDate(month: number, day: number) {
  const year = Number(SAMPLE_BASE_DATE.slice(0, 4));
  const parsed = new Date(year, month - 1, day);

  return (
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function parseNotificationText(text: string, transactions: Transaction[]): ParsedNotificationRow[] {
  const existingKeys = new Set(transactions.map((transaction) => getTransactionKey(transaction)));
  const batchKeys = new Set<string>();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    if (["승인취소", "취소", "환불"].some((keyword) => line.includes(keyword))) {
      return {
        line,
        reason: "취소/환불 항목",
        status: "cancelled"
      };
    }

    if (!line.includes("승인")) {
      return {
        line,
        reason: "승인 문구가 없어 제외",
        status: "ignored"
      };
    }

    const match = line.match(
      /^\[([^\]]+)\]\s+(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})\s+(.+?)\s+([\d,]+)원\s*승인/
    );

    if (!match) {
      return {
        line,
        reason: "알림 형식을 읽을 수 없음",
        status: "failed"
      };
    }

    const [, accountText, monthText, dayText, hourText, minuteText, merchantText, amountText] =
      match;
    const account = accountText.trim();
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const amount = Number(amountText.replaceAll(",", ""));
    const merchant = merchantText.trim();

    if (!isValidNotificationDate(month, day) || hour > 23 || minute > 59) {
      return {
        line,
        reason: "날짜 또는 시간이 유효하지 않음",
        status: "failed"
      };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        line,
        reason: "금액을 읽을 수 없음",
        status: "failed"
      };
    }

    const date = formatNotificationDate(month, day);
    const key = getTransactionKey({ account, amount, date, merchant });
    const duplicate = existingKeys.has(key) || batchKeys.has(key);
    batchKeys.add(key);

    return {
      account,
      amount,
      category: inferNotificationCategory(merchant),
      date,
      duplicate,
      line,
      memo: "아이폰 알림 붙여넣기",
      merchant,
      owner: inferNotificationOwner(account),
      status: "parsed",
      time: `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`,
      type: "카드"
    };
  });
}

function parseCsvTable(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"") {
      if (quoted && nextChar === "\"") {
        cell += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }

  return rows;
}

function normalizeCsvHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function findCsvColumn(headers: string[], candidates: string[]) {
  const normalizedCandidates = candidates.map(normalizeCsvHeader);
  return headers.findIndex((header) => normalizedCandidates.includes(normalizeCsvHeader(header)));
}

function readCsvCell(row: string[], index: number) {
  return index >= 0 ? (row[index] ?? "").trim() : "";
}

function alignCsvRow(row: string[], headerCount: number, amountIndex: number) {
  if (row.length <= headerCount || amountIndex < 0) {
    return row;
  }

  const overflowCount = row.length - headerCount;

  return [
    ...row.slice(0, amountIndex),
    row.slice(amountIndex, amountIndex + overflowCount + 1).join(","),
    ...row.slice(amountIndex + overflowCount + 1)
  ];
}

function normalizeCsvDate(value: string) {
  const trimmed = value.trim();
  const fullDateMatch = trimmed.match(/^(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);

  if (fullDateMatch) {
    const [, yearText, monthText, dayText] = fullDateMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (isValidFullDate(year, month, day)) {
      return `${year}-${`${month}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
    }
  }

  const compactDateMatch = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (compactDateMatch) {
    const [, yearText, monthText, dayText] = compactDateMatch;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (isValidFullDate(year, month, day)) {
      return `${year}-${monthText}-${dayText}`;
    }
  }

  const shortDateMatch = trimmed.match(/^(\d{1,2})[-./](\d{1,2})$/);

  if (shortDateMatch) {
    const [, monthText, dayText] = shortDateMatch;
    const month = Number(monthText);
    const day = Number(dayText);

    if (isValidNotificationDate(month, day)) {
      return formatNotificationDate(month, day);
    }
  }

  return null;
}

function isValidFullDate(year: number, month: number, day: number) {
  const parsed = new Date(year, month - 1, day);

  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function normalizeCsvAmount(value: string) {
  const normalized = value.replace(/[,\s원₩]/g, "").replace(/^\+/, "");
  const amount = Number(normalized);

  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseCsvText(text: string, transactions: Transaction[]): ParsedCsvRow[] {
  const table = parseCsvTable(text.replace(/^\uFEFF/, ""));

  if (table.length < 2) {
    return [
      {
        raw: text.trim(),
        reason: "헤더와 데이터 행을 찾을 수 없음",
        rowNumber: 1,
        status: "failed"
      }
    ];
  }

  const [headers, ...rows] = table;
  const dateIndex = findCsvColumn(headers, ["날짜", "이용일", "승인일", "거래일", "date"]);
  const merchantIndex = findCsvColumn(headers, ["사용처", "가맹점", "이용가맹점", "merchant", "내용"]);
  const amountIndex = findCsvColumn(headers, ["금액", "이용금액", "승인금액", "amount"]);
  const accountIndex = findCsvColumn(headers, ["카드", "카드명", "account", "결제수단"]);
  const memoIndex = findCsvColumn(headers, ["메모", "memo", "비고"]);

  if (dateIndex < 0 || merchantIndex < 0 || amountIndex < 0) {
    return [
      {
        raw: headers.join(", "),
        reason: "필수 컬럼(날짜, 사용처, 금액)을 찾을 수 없음",
        rowNumber: 1,
        status: "failed"
      }
    ];
  }

  const existingKeys = new Set(transactions.map((transaction) => getTransactionKey(transaction)));
  const batchKeys = new Set<string>();

  return rows.map((rawRow, index) => {
    const row = alignCsvRow(rawRow, headers.length, amountIndex);
    const rowNumber = index + 2;
    const raw = rawRow.join(", ");
    const date = normalizeCsvDate(readCsvCell(row, dateIndex));
    const merchant = readCsvCell(row, merchantIndex);
    const amount = normalizeCsvAmount(readCsvCell(row, amountIndex));
    const account = readCsvCell(row, accountIndex) || "카드";
    const memo = readCsvCell(row, memoIndex) || "CSV 가져오기";

    if (!date) {
      return {
        raw,
        reason: "날짜를 YYYY-MM-DD 형식으로 정규화할 수 없음",
        rowNumber,
        status: "failed"
      };
    }

    if (!merchant) {
      return {
        raw,
        reason: "사용처를 찾을 수 없음",
        rowNumber,
        status: "failed"
      };
    }

    if (amount === null) {
      return {
        raw,
        reason: "금액을 숫자로 변환할 수 없음",
        rowNumber,
        status: "failed"
      };
    }

    const key = getTransactionKey({ account, amount, date, merchant });
    const duplicate = existingKeys.has(key) || batchKeys.has(key);
    batchKeys.add(key);

    return {
      account,
      amount,
      category: inferNotificationCategory(merchant),
      date,
      duplicate,
      memo,
      merchant,
      owner: inferNotificationOwner(account),
      rowNumber,
      status: "parsed",
      type: "카드"
    };
  });
}

function getTodayFileDate() {
  return toDateInputValue(new Date());
}

function escapeCsvValue(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function serializeTransactionsToBackupCsv(transactions: Transaction[]) {
  const header = backupCsvColumns.join(",");
  const body = transactions.map((transaction) =>
    backupCsvColumns
      .map((column) => escapeCsvValue(transaction[column]))
      .join(",")
  );

  return `\uFEFF${[header, ...body].join("\r\n")}`;
}

function downloadCsvFile(filename: string, csvText: string) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function parseBackupCsvText(text: string, transactions: Transaction[]): ParsedBackupCsvRow[] {
  const table = parseCsvTable(text.replace(/^\uFEFF/, ""));

  if (table.length < 2) {
    return [
      {
        raw: text.trim(),
        reason: "헤더와 데이터 행을 찾을 수 없음",
        rowNumber: 1,
        status: "failed"
      }
    ];
  }

  const [headers, ...rows] = table;
  const columnIndexes = Object.fromEntries(
    backupCsvColumns.map((column) => [column, findCsvColumn(headers, [column])])
  ) as Record<(typeof backupCsvColumns)[number], number>;
  const missingColumns = backupCsvColumns.filter((column) => columnIndexes[column] < 0);

  if (missingColumns.length > 0) {
    return [
      {
        raw: headers.join(", "),
        reason: `백업 CSV 필수 컬럼 누락: ${missingColumns.join(", ")}`,
        rowNumber: 1,
        status: "failed"
      }
    ];
  }

  const existingIds = new Set(transactions.map((transaction) => transaction.id));
  const existingKeys = new Set(transactions.map((transaction) => getTransactionKey(transaction)));
  const batchIds = new Set<string>();
  const batchKeys = new Set<string>();
  const generatedIdSeed = Date.now();

  return rows.map((rawRow, index) => {
    const row = alignCsvRow(rawRow, headers.length, columnIndexes.amount);
    const rowNumber = index + 2;
    const raw = rawRow.join(", ");
    const originalId = readCsvCell(row, columnIndexes.id);
    const date = normalizeCsvDate(readCsvCell(row, columnIndexes.date));
    const ownerValue = readCsvCell(row, columnIndexes.owner);
    const typeValue = readCsvCell(row, columnIndexes.type);
    const account = readCsvCell(row, columnIndexes.account);
    const merchant = readCsvCell(row, columnIndexes.merchant);
    const category = readCsvCell(row, columnIndexes.category);
    const amount = normalizeCsvAmount(readCsvCell(row, columnIndexes.amount));
    const memo = readCsvCell(row, columnIndexes.memo);

    if (!date) {
      return {
        raw,
        reason: "날짜를 YYYY-MM-DD 형식으로 정규화할 수 없음",
        rowNumber,
        status: "failed"
      };
    }

    if (!ownerOptions.includes(ownerValue as Owner)) {
      return {
        raw,
        reason: "소유 값은 남편, 아내, 공동 중 하나여야 함",
        rowNumber,
        status: "failed"
      };
    }

    if (!typeOptions.includes(typeValue as TransactionType)) {
      return {
        raw,
        reason: "유형 값은 카드, 계좌, 현금 중 하나여야 함",
        rowNumber,
        status: "failed"
      };
    }

    if (!account || !merchant || !category) {
      return {
        raw,
        reason: "필수값 누락: 계좌, 사용처, 카테고리는 비워둘 수 없음",
        rowNumber,
        status: "failed"
      };
    }

    if (amount === null) {
      return {
        raw,
        reason: "금액을 숫자로 변환할 수 없음",
        rowNumber,
        status: "failed"
      };
    }

    const key = getTransactionKey({ account, amount, date, merchant });
    const action: BackupCsvAction =
      existingKeys.has(key) || batchKeys.has(key) ? "duplicate" : "add";
    const id =
      originalId && (action === "duplicate" || (!existingIds.has(originalId) && !batchIds.has(originalId)))
        ? originalId
        : `tx-backup-${generatedIdSeed}-${index}`;

    batchIds.add(id);

    batchKeys.add(key);

    return {
      action,
      rowNumber,
      status: "parsed",
      transaction: {
        account,
        amount,
        category,
        date,
        id,
        memo,
        merchant,
        owner: ownerValue as Owner,
        type: typeValue as TransactionType
      }
    };
  });
}

function getBackupCsvActionLabel(action: BackupCsvAction) {
  if (action === "add") {
    return "추가 가능";
  }

  return "중복";
}

function getBackupCsvActionTone(action: BackupCsvAction) {
  if (action === "add") {
    return "green";
  }

  return "orange";
}

function getBudgetStatusLabel(status: BudgetUsageRow["status"]) {
  if (status === "over") {
    return "초과";
  }

  if (status === "warning") {
    return "주의";
  }

  if (status === "unset") {
    return "예산 미설정";
  }

  return "정상";
}

function getBudgetStatusTone(status: BudgetUsageRow["status"]) {
  if (status === "over" || status === "warning") {
    return "orange";
  }

  if (status === "unset") {
    return "slate";
  }

  return "green";
}

function getBudgetBarColor(status: BudgetUsageRow["status"]) {
  if (status === "over") {
    return "bg-red-500";
  }

  if (status === "warning") {
    return "bg-orange-500";
  }

  if (status === "unset") {
    return "bg-slate-300";
  }

  return "bg-blue-600";
}

function Card({
  children,
  className
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200/80 bg-white/90 p-5 shadow-soft backdrop-blur",
        className
      )}
    >
      {children}
    </section>
  );
}

function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Badge({
  children,
  tone = "slate"
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "slate";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold",
        tone === "blue" && "bg-blue-50 text-blue-700",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "orange" && "bg-orange-50 text-orange-700",
        tone === "slate" && "bg-slate-100 text-slate-700"
      )}
    >
      {children}
    </span>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
        props.className
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
        props.className
      )}
    />
  );
}

function Tabs({
  active,
  onChange
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {tabItems.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "min-h-10 rounded-md px-3 text-sm font-semibold text-slate-600 transition",
            active === tab.id && "bg-blue-600 text-white shadow-sm",
            active !== tab.id && "hover:bg-slate-50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function SelectField<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: T[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "orange" | "slate";
}) {
  return (
    <Card className="grid min-h-36 gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
            {value}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-slate-700">{icon}</div>
      </div>
      <Badge tone={tone}>{detail}</Badge>
    </Card>
  );
}

function ChartFallback({ message = "차트 준비 중" }: { message?: string }) {
  return (
    <div className="flex h-full min-h-72 items-center justify-center rounded-md bg-slate-50 text-sm font-semibold text-slate-400">
      {message}
    </div>
  );
}

function ChartBox({
  children,
  fallbackMessage,
  ready
}: {
  children: (size: { height: number; width: number }) => React.ReactNode;
  fallbackMessage: string;
  ready: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const height = 288;

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(0, Math.floor(entry.contentRect.width)));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-72 min-w-0">
      {ready && width > 0 ? children({ height, width }) : <ChartFallback message={fallbackMessage} />}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(defaultPeriodFilter);
  const [customRange, setCustomRange] = useState({
    startDate: defaultPeriodFilter.startDate,
    endDate: defaultPeriodFilter.endDate
  });
  const [storageReady, setStorageReady] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const [resetStorageToken, setResetStorageToken] = useState(0);
  const [draft, setDraft] = useState<DraftTransaction>(emptyDraft);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftTransaction>(emptyDraft);
  const [editNotice, setEditNotice] = useState("수정할 거래를 선택해주세요.");
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [accountFormMode, setAccountFormMode] = useState<AccountFormMode>("idle");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountDraft, setAccountDraft] = useState<AccountDraft>(emptyAccountDraft);
  const [accountNotice, setAccountNotice] = useState(
    "은행 API 연동 전까지 잔고를 수기로 관리합니다."
  );
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [budgetFormMode, setBudgetFormMode] = useState<BudgetFormMode>("idle");
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState<BudgetDraft>(emptyBudgetDraft);
  const [budgetNotice, setBudgetNotice] = useState("월간 카테고리별 예산을 관리합니다.");
  const [periodMemo, setPeriodMemo] = useState(DEFAULT_PERIOD_MEMO);
  const [notificationText, setNotificationText] = useState("");
  const [parsedNotificationRows, setParsedNotificationRows] = useState<ParsedNotificationRow[]>([]);
  const [importNotice, setImportNotice] = useState("붙여넣은 카드 승인 알림을 분석해주세요.");
  const [csvFileName, setCsvFileName] = useState("");
  const [parsedCsvRows, setParsedCsvRows] = useState<ParsedCsvRow[]>([]);
  const [csvImportNotice, setCsvImportNotice] =
    useState("CSV 파일을 선택하면 브라우저에서만 분석합니다.");
  const [backupCsvFileName, setBackupCsvFileName] = useState("");
  const [parsedBackupCsvRows, setParsedBackupCsvRows] = useState<ParsedBackupCsvRow[]>([]);
  const [backupCsvNotice, setBackupCsvNotice] = useState(
    "CSV를 구글시트에 업로드해 백업하거나 수기 수정 후 다시 가져올 수 있습니다."
  );
  const [telegramNotice, setTelegramNotice] = useState(
    "텔레그램 발송은 환경변수 설정 후 사용할 수 있습니다."
  );
  const [telegramSending, setTelegramSending] = useState(false);
  const [syncPin, setSyncPin] = useState("");
  const [cloudNotice, setCloudNotice] = useState(
    "Supabase Free 공동 저장은 환경변수 설정 후 사용할 수 있습니다."
  );
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudLastSaveAt, setCloudLastSaveAt] = useState<string | null>(null);
  const [cloudLastLoadAt, setCloudLastLoadAt] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState("샘플 데이터로 시작했습니다.");
  const [connectorNotice, setConnectorNotice] = useState("아직 외부 API는 연결하지 않았습니다.");
  const [storageNotice, setStorageNotice] = useState("브라우저 저장소와 동기화 준비 중입니다.");

  const totalBalance = useMemo(() => getTotalBalance(accounts), [accounts]);
  const filteredTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.date >= periodFilter.startDate && transaction.date <= periodFilter.endDate
      ),
    [transactions, periodFilter]
  );
  const totalSpending = useMemo(
    () => getTotalSpending(filteredTransactions),
    [filteredTransactions]
  );
  const scheduledCardPayment = useMemo(
    () => getScheduledCardPayment(filteredTransactions),
    [filteredTransactions]
  );
  const categoryData = useMemo(
    () => groupTransactionsByCategory(filteredTransactions),
    [filteredTransactions]
  );
  const ownerData = useMemo(
    () => groupTransactionsByOwner(filteredTransactions),
    [filteredTransactions]
  );
  const weeklyFlowData = useMemo(() => {
    const grouped = getWeeklyFlow(filteredTransactions);
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, amount]) => ({ date: shortDate(date), amount }));
  }, [filteredTransactions]);
  const sortedFilteredTransactions = useMemo(
    () => [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date)),
    [filteredTransactions]
  );
  const recentTransactions = useMemo(
    () => sortedFilteredTransactions.slice(0, 8),
    [sortedFilteredTransactions]
  );
  const periodLabel = getPeriodLabel(periodFilter.periodType);
  const reportPeriodLabel = getReportPeriodLabel(periodFilter.periodType);
  const periodSpendingLabel = getPeriodSpendingLabel(periodFilter.periodType);
  const periodRangeText = `${formatPeriodDate(periodFilter.startDate)} ~ ${formatPeriodDate(
    periodFilter.endDate
  )}`;
  const topCategory = categoryData[0];
  const budgetUsageRows = useMemo<BudgetUsageRow[]>(() => {
    const categorySpendMap = new Map(categoryData.map((category) => [category.name, category.amount]));
    const budgetMap = new Map(budgets.map((budget) => [budget.category, budget]));
    const categories = Array.from(
      new Set([...budgets.map((budget) => budget.category), ...categoryData.map((category) => category.name)])
    );

    return categories
      .map((category) => {
        const budget = budgetMap.get(category);
        const spent = categorySpendMap.get(category) ?? 0;
        const monthlyLimit = budget?.monthlyLimit ?? null;
        const usageRate =
          monthlyLimit && monthlyLimit > 0 ? Math.round((spent / monthlyLimit) * 100) : null;
        const status: BudgetUsageRow["status"] =
          monthlyLimit === null
            ? "unset"
            : usageRate !== null && usageRate >= 100
              ? "over"
              : usageRate !== null && usageRate >= 80
                ? "warning"
                : "safe";

        return {
          category,
          id: budget?.id ?? `unbudgeted-${category}`,
          memo: budget?.memo ?? "",
          monthlyLimit,
          spent,
          status,
          usageRate
        };
      })
      .sort((a, b) => {
        const statusWeight = { over: 0, warning: 1, unset: 2, safe: 3 };
        return statusWeight[a.status] - statusWeight[b.status] || b.spent - a.spent;
      });
  }, [budgets, categoryData]);
  const topBudgetUsage =
    budgetUsageRows.find((row) => row.monthlyLimit !== null && row.spent > 0) ??
    budgetUsageRows.find((row) => row.monthlyLimit !== null);
  const budgetReportLine = topBudgetUsage
    ? topBudgetUsage.status === "over"
      ? `${topBudgetUsage.category} 예산을 초과했습니다.`
      : `${topBudgetUsage.category} 예산의 ${topBudgetUsage.usageRate ?? 0}%를 사용했습니다.`
    : "카테고리 예산이 아직 설정되지 않았습니다.";
  const budgetWarningCount = budgetUsageRows.filter(
    (row) => row.status === "warning" || row.status === "over"
  ).length;
  const husbandSpending = ownerData.find((owner) => owner.name === "남편")?.amount ?? 0;
  const wifeSpending = ownerData.find((owner) => owner.name === "아내")?.amount ?? 0;
  const sharedSpending = ownerData.find((owner) => owner.name === "공동")?.amount ?? 0;
  const telegramReportMessage = [
    "[우리집 금융 리포트]",
    "",
    `기간: ${periodRangeText}`,
    `조회 유형: ${reportPeriodLabel}`,
    "",
    `총 지출: ${formatKRW(totalSpending)}`,
    `카드 결제예정액: ${formatKRW(scheduledCardPayment)}`,
    "",
    `남편 지출: ${formatKRW(husbandSpending)}`,
    `아내 지출: ${formatKRW(wifeSpending)}`,
    `공동 지출: ${formatKRW(sharedSpending)}`,
    "",
    "가장 큰 카테고리:",
    topCategory ? `${topCategory.name} ${formatKRW(topCategory.amount)}` : "데이터 없음 0원",
    "",
    "예산 상태:",
    budgetReportLine,
    "",
    "메모:",
    periodMemo.trim() || "작성된 기간 메모가 없습니다.",
    "",
    "안내:",
    "이 리포트는 부부 금융 대시보드에서 발송되었습니다."
  ].join("\n");
  const reportLines = [
    `리포트 기간: ${periodRangeText}`,
    `${periodSpendingLabel}은 ${formatKRW(totalSpending)}입니다.`,
    topCategory
      ? `가장 큰 카테고리는 ${topCategory.name}이며 ${formatKRW(topCategory.amount)}를 사용했습니다.`
      : "아직 카테고리 데이터가 없습니다.",
    budgetReportLine,
    `카드 결제예정액은 ${formatKRW(scheduledCardPayment)}입니다.`,
    "금융 API와 구글시트 직접 연동은 다음 단계에서 연결합니다."
  ];
  const parsedSuccessRows = parsedNotificationRows.filter(
    (row): row is ParsedNotificationSuccess => row.status === "parsed"
  );
  const addableNotificationRows = parsedSuccessRows.filter((row) => !row.duplicate);
  const issueNotificationRows = parsedNotificationRows.filter(
    (row): row is ParsedNotificationIssue => row.status !== "parsed"
  );
  const parsedCsvSuccessRows = parsedCsvRows.filter(
    (row): row is ParsedCsvSuccess => row.status === "parsed"
  );
  const addableCsvRows = parsedCsvSuccessRows.filter((row) => !row.duplicate);
  const failedCsvRows = parsedCsvRows.filter((row): row is ParsedCsvIssue => row.status === "failed");
  const parsedBackupCsvSuccessRows = parsedBackupCsvRows.filter(
    (row): row is ParsedBackupCsvSuccess => row.status === "parsed"
  );
  const addableBackupCsvRows = parsedBackupCsvSuccessRows.filter((row) => row.action === "add");
  const failedBackupCsvRows = parsedBackupCsvRows.filter(
    (row): row is ParsedBackupCsvIssue => row.status === "failed"
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTransactions = parseStoredTransactions(
      window.localStorage.getItem(STORAGE_KEYS.transactions)
    );
    const storedMemo = parseStoredMemo(window.localStorage.getItem(STORAGE_KEYS.periodMemo));
    const storedAccounts = parseStoredAccounts(window.localStorage.getItem(STORAGE_KEYS.accounts));
    const storedBudgets = parseStoredBudgets(window.localStorage.getItem(STORAGE_KEYS.budgets));
    const storedSyncPin = window.localStorage.getItem(STORAGE_KEYS.syncPin);
    const storedCloudLastSaveAt = window.localStorage.getItem(STORAGE_KEYS.cloudLastSaveAt);
    const storedCloudLastLoadAt = window.localStorage.getItem(STORAGE_KEYS.cloudLastLoadAt);

    if (storedTransactions) {
      setTransactions(storedTransactions);
    }

    if (storedMemo !== null) {
      setPeriodMemo(storedMemo);
    }

    if (storedAccounts) {
      setAccounts(storedAccounts);
    }

    if (storedBudgets) {
      setBudgets(storedBudgets);
    }

    if (storedSyncPin) {
      setSyncPin(storedSyncPin);
    }

    if (storedCloudLastSaveAt) {
      setCloudLastSaveAt(storedCloudLastSaveAt);
    }

    if (storedCloudLastLoadAt) {
      setCloudLastLoadAt(storedCloudLastLoadAt);
    }

    setStorageNotice(
      storedTransactions || storedMemo !== null || storedAccounts || storedBudgets
        ? "저장된 데이터를 불러왔습니다."
        : "샘플 데이터로 시작했습니다. 변경사항은 이 브라우저에 저장됩니다."
    );
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
    } catch {
      setStorageNotice("거래내역을 브라우저 저장소에 저장하지 못했습니다.");
    }
  }, [storageReady, transactions]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.periodMemo, JSON.stringify(periodMemo));
    } catch {
      setStorageNotice("기간 메모를 브라우저 저장소에 저장하지 못했습니다.");
    }
  }, [periodMemo, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
    } catch {
      setStorageNotice("계좌 정보를 브라우저 저장소에 저장하지 못했습니다.");
    }
  }, [accounts, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
    } catch {
      setStorageNotice("예산 정보를 브라우저 저장소에 저장하지 못했습니다.");
    }
  }, [budgets, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") {
      return;
    }

    try {
      if (syncPin.trim()) {
        window.localStorage.setItem(STORAGE_KEYS.syncPin, syncPin);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.syncPin);
      }
    } catch {
      setStorageNotice("동기화 PIN을 브라우저 저장소에 저장하지 못했습니다.");
    }
  }, [storageReady, syncPin]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") {
      return;
    }

    try {
      if (cloudLastSaveAt) {
        window.localStorage.setItem(STORAGE_KEYS.cloudLastSaveAt, cloudLastSaveAt);
      }
    } catch {
      setStorageNotice("마지막 클라우드 저장 시간을 브라우저 저장소에 저장하지 못했습니다.");
    }
  }, [cloudLastSaveAt, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") {
      return;
    }

    try {
      if (cloudLastLoadAt) {
        window.localStorage.setItem(STORAGE_KEYS.cloudLastLoadAt, cloudLastLoadAt);
      }
    } catch {
      setStorageNotice("마지막 클라우드 불러오기 시간을 브라우저 저장소에 저장하지 못했습니다.");
    }
  }, [cloudLastLoadAt, storageReady]);

  useEffect(() => {
    if (!resetStorageToken || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(STORAGE_KEYS.transactions);
      window.localStorage.removeItem(STORAGE_KEYS.periodMemo);
      window.localStorage.removeItem(STORAGE_KEYS.accounts);
      window.localStorage.removeItem(STORAGE_KEYS.budgets);
      window.localStorage.removeItem(STORAGE_KEYS.syncPin);
      window.localStorage.removeItem(STORAGE_KEYS.cloudLastSaveAt);
      window.localStorage.removeItem(STORAGE_KEYS.cloudLastLoadAt);
    } catch {
      setStorageNotice("브라우저 저장소 초기화 중 오류가 있었지만 화면 데이터는 복구했습니다.");
    }
  }, [resetStorageToken]);

  useEffect(() => {
    setChartsReady(true);
  }, []);

  function selectPresetPeriod(periodType: Exclude<PeriodType, "custom">) {
    const nextRange = getPresetDateRange(periodType);
    setPeriodFilter({ periodType, ...nextRange });
    setCustomRange(nextRange);
  }

  function selectCustomPeriod() {
    setPeriodFilter((current) => ({ ...current, periodType: "custom" }));
    setCustomRange({
      startDate: periodFilter.startDate,
      endDate: periodFilter.endDate
    });
  }

  function applyCustomPeriod() {
    if (!customRange.startDate || !customRange.endDate) {
      return;
    }

    const nextRange = normalizeDateRange(customRange.startDate, customRange.endDate);
    setCustomRange(nextRange);
    setPeriodFilter({ periodType: "custom", ...nextRange });
  }

  function updateDraft<K extends keyof DraftTransaction>(
    key: K,
    value: DraftTransaction[K]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateEditDraft<K extends keyof DraftTransaction>(
    key: K,
    value: DraftTransaction[K]
  ) {
    setEditDraft((current) => ({ ...current, [key]: value }));
  }

  function updateAccountDraft<K extends keyof AccountDraft>(
    key: K,
    value: AccountDraft[K]
  ) {
    setAccountDraft((current) => ({ ...current, [key]: value }));
  }

  function updateBudgetDraft<K extends keyof BudgetDraft>(
    key: K,
    value: BudgetDraft[K]
  ) {
    setBudgetDraft((current) => ({ ...current, [key]: value }));
  }

  function startAddAccount() {
    setAccountFormMode("add");
    setEditingAccountId(null);
    setAccountDraft(emptyAccountDraft);
    setAccountNotice("새 계좌 정보를 입력해주세요.");
  }

  function startEditAccount(account: Account) {
    setAccountFormMode("edit");
    setEditingAccountId(account.id);
    setAccountDraft({
      balance: String(account.balance),
      bank: account.bank,
      memo: account.memo ?? "",
      name: account.name,
      owner: account.owner,
      status: account.status
    });
    setAccountNotice(`${account.name} 계좌를 수정 중입니다.`);
  }

  function cancelAccountForm() {
    setAccountFormMode("idle");
    setEditingAccountId(null);
    setAccountDraft(emptyAccountDraft);
    setAccountNotice("계좌 수정을 취소했습니다.");
  }

  function startAddBudget() {
    setBudgetFormMode("add");
    setEditingBudgetId(null);
    setBudgetDraft(emptyBudgetDraft);
    setBudgetNotice("새 카테고리 예산을 입력해주세요.");
  }

  function startEditBudget(budget: Budget) {
    setBudgetFormMode("edit");
    setEditingBudgetId(budget.id);
    setBudgetDraft({
      category: budget.category,
      monthlyLimit: String(budget.monthlyLimit),
      memo: budget.memo
    });
    setBudgetNotice(`${budget.category} 예산을 수정 중입니다.`);
  }

  function cancelBudgetForm() {
    setBudgetFormMode("idle");
    setEditingBudgetId(null);
    setBudgetDraft(emptyBudgetDraft);
    setBudgetNotice("예산 수정을 취소했습니다.");
  }

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(draft.amount);

    if (!draft.merchant.trim() || !draft.account.trim() || !Number.isFinite(amount) || amount <= 0) {
      setFormNotice("거래처, 계좌, 금액을 확인해주세요.");
      return;
    }

    const nextTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      date: draft.date,
      owner: draft.owner,
      type: draft.type,
      account: draft.account.trim(),
      merchant: draft.merchant.trim(),
      category: draft.category.trim() || "미분류",
      amount,
      memo: draft.memo.trim()
    };

    setTransactions((current) => [nextTransaction, ...current]);
    setDraft({ ...emptyDraft, date: draft.date });
    setFormNotice(`${nextTransaction.merchant} ${formatKRW(amount)} 거래를 추가했습니다.`);
  }

  function updateTransactionMemo(id: string, memo: string) {
    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id ? { ...transaction, memo } : transaction
      )
    );
  }

  function startEditTransaction(transaction: Transaction) {
    setEditingTransactionId(transaction.id);
    setEditDraft({
      account: transaction.account,
      amount: String(transaction.amount),
      category: transaction.category,
      date: transaction.date,
      memo: transaction.memo,
      merchant: transaction.merchant,
      owner: transaction.owner,
      type: transaction.type
    });
    setEditNotice(`${transaction.merchant} 거래를 수정 중입니다.`);
    setActiveTab("transactions");
  }

  function cancelEditTransaction() {
    setEditingTransactionId(null);
    setEditDraft(emptyDraft);
    setEditNotice("수정을 취소했습니다.");
  }

  function saveEditedTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTransactionId) {
      setEditNotice("수정할 거래를 먼저 선택해주세요.");
      return;
    }

    const amount = Number(editDraft.amount);

    if (
      !editDraft.date ||
      !editDraft.account.trim() ||
      !editDraft.merchant.trim() ||
      !editDraft.category.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setEditNotice("날짜, 계좌, 사용처, 카테고리, 금액을 확인해주세요.");
      return;
    }

    const nextTransaction: Transaction = {
      account: editDraft.account.trim(),
      amount,
      category: editDraft.category.trim(),
      date: editDraft.date,
      id: editingTransactionId,
      memo: editDraft.memo.trim(),
      merchant: editDraft.merchant.trim(),
      owner: editDraft.owner,
      type: editDraft.type
    };

    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === editingTransactionId ? nextTransaction : transaction
      )
    );
    setEditingTransactionId(null);
    setEditDraft(emptyDraft);
    setEditNotice(`${nextTransaction.merchant} 거래를 저장했습니다.`);
  }

  function deleteTransaction(transaction: Transaction) {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`${transaction.merchant} ${formatKRW(transaction.amount)} 거래를 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    setTransactions((current) => current.filter((item) => item.id !== transaction.id));

    if (editingTransactionId === transaction.id) {
      setEditingTransactionId(null);
      setEditDraft(emptyDraft);
    }

    setEditNotice(`${transaction.merchant} 거래를 삭제했습니다.`);
  }

  function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const balance = Number(accountDraft.balance);

    if (
      !accountDraft.name.trim() ||
      !accountDraft.bank.trim() ||
      !accountDraft.status.trim() ||
      !Number.isFinite(balance) ||
      balance < 0
    ) {
      setAccountNotice("계좌명, 은행명, 상태, 잔고를 확인해주세요.");
      return;
    }

    const nextAccount: Account = {
      balance,
      bank: accountDraft.bank.trim(),
      id: editingAccountId ?? `acct-${Date.now()}`,
      memo: accountDraft.memo.trim(),
      name: accountDraft.name.trim(),
      owner: accountDraft.owner,
      status: accountDraft.status.trim()
    };

    if (accountFormMode === "edit" && editingAccountId) {
      setAccounts((current) =>
        current.map((account) => (account.id === editingAccountId ? nextAccount : account))
      );
      setAccountNotice(`${nextAccount.name} 계좌 정보를 저장했습니다.`);
    } else {
      setAccounts((current) => [nextAccount, ...current]);
      setAccountNotice(`${nextAccount.name} 계좌를 추가했습니다.`);
    }

    setAccountFormMode("idle");
    setEditingAccountId(null);
    setAccountDraft(emptyAccountDraft);
  }

  function deleteAccount(account: Account) {
    if (accounts.length <= 1) {
      setAccountNotice("최소 1개 계좌는 남겨주세요.");
      return;
    }

    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`${account.name} ${formatKRW(account.balance)} 계좌를 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    setAccounts((current) => current.filter((item) => item.id !== account.id));

    if (editingAccountId === account.id) {
      setAccountFormMode("idle");
      setEditingAccountId(null);
      setAccountDraft(emptyAccountDraft);
    }

    setAccountNotice(`${account.name} 계좌를 삭제했습니다.`);
  }

  function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const monthlyLimit = Number(budgetDraft.monthlyLimit);
    const category = budgetDraft.category.trim();

    if (!category || !Number.isFinite(monthlyLimit) || monthlyLimit <= 0) {
      setBudgetNotice("카테고리명과 월 예산을 확인해주세요.");
      return;
    }

    const duplicatedCategory = budgets.some(
      (budget) => budget.category === category && budget.id !== editingBudgetId
    );

    if (duplicatedCategory) {
      setBudgetNotice("이미 같은 카테고리 예산이 있습니다. 기존 예산을 수정해주세요.");
      return;
    }

    const nextBudget: Budget = {
      category,
      id: editingBudgetId ?? `budget-${Date.now()}`,
      memo: budgetDraft.memo.trim(),
      monthlyLimit
    };

    if (budgetFormMode === "edit" && editingBudgetId) {
      setBudgets((current) =>
        current.map((budget) => (budget.id === editingBudgetId ? nextBudget : budget))
      );
      setBudgetNotice(`${nextBudget.category} 예산을 저장했습니다.`);
    } else {
      setBudgets((current) => [nextBudget, ...current]);
      setBudgetNotice(`${nextBudget.category} 예산을 추가했습니다.`);
    }

    setBudgetFormMode("idle");
    setEditingBudgetId(null);
    setBudgetDraft(emptyBudgetDraft);
  }

  function deleteBudget(budget: Budget) {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`${budget.category} 월 예산 ${formatKRW(budget.monthlyLimit)}을 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    setBudgets((current) => current.filter((item) => item.id !== budget.id));

    if (editingBudgetId === budget.id) {
      setBudgetFormMode("idle");
      setEditingBudgetId(null);
      setBudgetDraft(emptyBudgetDraft);
    }

    setBudgetNotice(`${budget.category} 예산을 삭제했습니다.`);
  }

  function analyzeNotificationText() {
    const rows = parseNotificationText(notificationText, transactions);
    const parsedCount = rows.filter((row) => row.status === "parsed").length;
    const addableCount = rows.filter((row) => row.status === "parsed" && !row.duplicate).length;
    const duplicateCount = rows.filter((row) => row.status === "parsed" && row.duplicate).length;
    const issueCount = rows.filter((row) => row.status !== "parsed").length;

    setParsedNotificationRows(rows);

    if (rows.length === 0) {
      setImportNotice("분석할 알림 줄이 없습니다.");
      return;
    }

    setImportNotice(
      `분석 완료: 승인 ${parsedCount}건, 추가 가능 ${addableCount}건, 중복 ${duplicateCount}건, 제외/실패 ${issueCount}건`
    );
  }

  function addParsedNotificationsToTransactions() {
    const timestamp = Date.now();
    const nextTransactions = addableNotificationRows.map<Transaction>((row, index) => ({
      account: row.account,
      amount: row.amount,
      category: row.category,
      date: row.date,
      id: `tx-import-${timestamp}-${index}`,
      memo: row.memo,
      merchant: row.merchant,
      owner: row.owner,
      type: row.type
    }));

    if (nextTransactions.length === 0) {
      setImportNotice("추가할 새 거래가 없습니다. 중복 또는 제외 항목만 있습니다.");
      return;
    }

    setTransactions((current) => [...nextTransactions, ...current]);
    setParsedNotificationRows((current) =>
      current.map((row) => (row.status === "parsed" ? { ...row, duplicate: true } : row))
    );
    setImportNotice(`${nextTransactions.length}건을 거래내역에 추가했습니다.`);
  }

  function handleCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (typeof FileReader === "undefined") {
      setCsvImportNotice("이 브라우저에서는 CSV 파일 읽기를 사용할 수 없습니다.");
      return;
    }

    setCsvFileName(file.name);
    setCsvImportNotice(`${file.name} 파일을 읽는 중입니다.`);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setParsedCsvRows([]);
        setCsvImportNotice("CSV 파일 내용을 텍스트로 읽지 못했습니다.");
        return;
      }

      const rows = parseCsvText(reader.result, transactions);
      const parsedCount = rows.filter((row) => row.status === "parsed").length;
      const addableCount = rows.filter((row) => row.status === "parsed" && !row.duplicate).length;
      const duplicateCount = rows.filter((row) => row.status === "parsed" && row.duplicate).length;
      const failedCount = rows.filter((row) => row.status === "failed").length;

      setParsedCsvRows(rows);
      setCsvImportNotice(
        `분석 완료: 정상 ${parsedCount}건, 추가 가능 ${addableCount}건, 중복 ${duplicateCount}건, 실패 ${failedCount}건`
      );
    };

    reader.onerror = () => {
      setParsedCsvRows([]);
      setCsvImportNotice("CSV 파일을 읽는 중 오류가 발생했습니다.");
    };

    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  function addParsedCsvRowsToTransactions() {
    const timestamp = Date.now();
    const nextTransactions = addableCsvRows.map<Transaction>((row, index) => ({
      account: row.account,
      amount: row.amount,
      category: row.category,
      date: row.date,
      id: `tx-import-${timestamp}-${index}`,
      memo: row.memo,
      merchant: row.merchant,
      owner: row.owner,
      type: row.type
    }));

    if (nextTransactions.length === 0) {
      setCsvImportNotice("추가할 새 CSV 거래가 없습니다. 중복 또는 실패 항목만 있습니다.");
      return;
    }

    setTransactions((current) => [...nextTransactions, ...current]);
    setParsedCsvRows((current) =>
      current.map((row) => (row.status === "parsed" ? { ...row, duplicate: true } : row))
    );
    setCsvImportNotice(`${nextTransactions.length}건을 거래내역에 추가했습니다.`);
  }

  function exportTransactionsBackupCsv() {
    const filename = `couple-finance-transactions-${getTodayFileDate()}.csv`;
    downloadCsvFile(filename, serializeTransactionsToBackupCsv(transactions));
    setBackupCsvNotice(`${transactions.length}건의 거래내역을 ${filename} 파일로 내보냈습니다.`);
  }

  function handleBackupCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (typeof FileReader === "undefined") {
      setBackupCsvNotice("이 브라우저에서는 CSV 파일 읽기를 사용할 수 없습니다.");
      return;
    }

    setBackupCsvFileName(file.name);
    setBackupCsvNotice(`${file.name} 파일을 읽는 중입니다.`);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setParsedBackupCsvRows([]);
        setBackupCsvNotice("CSV 파일 내용을 텍스트로 읽지 못했습니다.");
        return;
      }

      const rows = parseBackupCsvText(reader.result, transactions);
      const successRows = rows.filter(
        (row): row is ParsedBackupCsvSuccess => row.status === "parsed"
      );
      const addCount = successRows.filter((row) => row.action === "add").length;
      const duplicateCount = successRows.filter((row) => row.action === "duplicate").length;
      const failedCount = rows.filter((row) => row.status === "failed").length;

      setParsedBackupCsvRows(rows);
      setBackupCsvNotice(
        `분석 완료: 추가 가능 ${addCount}건, 중복 ${duplicateCount}건, 실패 ${failedCount}건`
      );
    };

    reader.onerror = () => {
      setParsedBackupCsvRows([]);
      setBackupCsvNotice("CSV 파일을 읽는 중 오류가 발생했습니다.");
    };

    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  function applyBackupCsvRowsToTransactions() {
    if (addableBackupCsvRows.length === 0) {
      setBackupCsvNotice("추가할 백업 CSV 거래가 없습니다. 중복 또는 실패 항목만 있습니다.");
      return;
    }

    const nextTransactions = addableBackupCsvRows.map((row) => row.transaction);

    setTransactions((current) => [...nextTransactions, ...current]);
    setParsedBackupCsvRows((current) =>
      current.map((row) =>
        row.status === "parsed" && row.action === "add" ? { ...row, action: "duplicate" } : row
      )
    );
    setBackupCsvNotice(`백업 CSV 거래 ${nextTransactions.length}건을 거래내역에 추가했습니다.`);
  }

  async function sendTelegramReport() {
    setTelegramSending(true);
    setTelegramNotice("텔레그램으로 리포트를 발송하는 중입니다.");

    try {
      const response = await fetch("/api/telegram", {
        body: JSON.stringify({ message: telegramReportMessage }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const result = (await response.json()) as TelegramSendResponse;

      setTelegramNotice(result.message || "텔레그램 발송 결과를 확인하지 못했습니다.");
    } catch {
      setTelegramNotice("텔레그램 발송 요청 중 오류가 발생했습니다.");
    } finally {
      setTelegramSending(false);
    }
  }

  async function saveCloudSnapshot() {
    const pin = syncPin.trim();

    if (!pin) {
      setCloudNotice("동기화 PIN을 입력해주세요.");
      return;
    }

    const confirmed =
      typeof window === "undefined" ||
      window.confirm(
        "현재 브라우저의 데이터를 클라우드에 저장합니다.\n기존 클라우드 데이터가 덮어써질 수 있습니다.\n계속하시겠습니까?"
      );

    if (!confirmed) {
      setCloudNotice("클라우드 저장을 취소했습니다.");
      return;
    }

    setCloudSyncing(true);
    setCloudNotice("클라우드에 현재 데이터를 저장하는 중입니다.");

    try {
      const response = await fetch("/api/cloud-sync", {
        body: JSON.stringify({
          data: {
            accounts,
            budgets,
            periodMemo,
            transactions
          },
          pin
        }),
        headers: {
          "Content-Type": "application/json",
          "x-sync-pin": pin
        },
        method: "POST"
      });
      const result = (await response.json()) as CloudSyncResponse;

      if (!result.ok) {
        setCloudNotice(result.message || "클라우드 저장에 실패했습니다.");
        return;
      }

      if (result.updatedAt) {
        setCloudLastSaveAt(result.updatedAt);
      }

      setCloudNotice(
        result.updatedAt
          ? `${result.message || "클라우드에 저장했습니다."} (${formatDateTime(result.updatedAt)})`
          : result.message || "클라우드에 저장했습니다."
      );
    } catch {
      setCloudNotice("클라우드 저장 요청 중 오류가 발생했습니다.");
    } finally {
      setCloudSyncing(false);
    }
  }

  async function loadCloudSnapshot() {
    const pin = syncPin.trim();

    if (!pin) {
      setCloudNotice("동기화 PIN을 입력해주세요.");
      return;
    }

    const confirmed =
      typeof window === "undefined" ||
      window.confirm(
        "클라우드 데이터를 불러오면 현재 브라우저의 데이터가 변경됩니다.\n계속하시겠습니까?"
      );

    if (!confirmed) {
      setCloudNotice("클라우드 불러오기를 취소했습니다.");
      return;
    }

    setCloudSyncing(true);
    setCloudNotice("클라우드에서 데이터를 불러오는 중입니다.");

    try {
      const params = new URLSearchParams({ pin });
      const response = await fetch(`/api/cloud-sync?${params.toString()}`, {
        headers: {
          "x-sync-pin": pin
        },
        method: "GET"
      });
      const result = (await response.json()) as CloudSyncResponse;

      if (!result.ok) {
        setCloudNotice(result.message || "클라우드 데이터를 불러오지 못했습니다.");
        return;
      }

      if (result.data === null) {
        setCloudNotice(result.message || "저장된 클라우드 데이터가 없습니다.");
        return;
      }

      if (!isCloudSyncSnapshotData(result.data)) {
        setCloudNotice("클라우드 데이터 구조가 현재 앱과 맞지 않습니다.");
        return;
      }

      setTransactions(result.data.transactions);
      setAccounts(result.data.accounts);
      setBudgets(result.data.budgets);
      setPeriodMemo(result.data.periodMemo);
      setEditingTransactionId(null);
      setEditDraft(emptyDraft);
      setAccountFormMode("idle");
      setEditingAccountId(null);
      setAccountDraft(emptyAccountDraft);
      setBudgetFormMode("idle");
      setEditingBudgetId(null);
      setBudgetDraft(emptyBudgetDraft);

      if (result.updatedAt) {
        setCloudLastLoadAt(result.updatedAt);
      }

      setCloudNotice(
        result.updatedAt
          ? `${result.message || "클라우드 데이터를 불러왔습니다."} (${formatDateTime(
              result.updatedAt
            )})`
          : result.message || "클라우드 데이터를 불러왔습니다."
      );
    } catch {
      setCloudNotice("클라우드 불러오기 요청 중 오류가 발생했습니다.");
    } finally {
      setCloudSyncing(false);
    }
  }

  function resetStoredData() {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.transactions);
        window.localStorage.removeItem(STORAGE_KEYS.periodMemo);
        window.localStorage.removeItem(STORAGE_KEYS.accounts);
        window.localStorage.removeItem(STORAGE_KEYS.budgets);
      } catch {
        setStorageNotice("브라우저 저장소 초기화 중 오류가 있었지만 화면 데이터는 복구했습니다.");
      }
    }

    setTransactions(initialTransactions);
    setAccounts(initialAccounts);
    setBudgets(initialBudgets);
    setPeriodMemo(DEFAULT_PERIOD_MEMO);
    setEditingTransactionId(null);
    setEditDraft(emptyDraft);
    setEditNotice("샘플 데이터로 초기화했습니다.");
    setAccountFormMode("idle");
    setEditingAccountId(null);
    setAccountDraft(emptyAccountDraft);
    setAccountNotice("샘플 계좌 정보로 초기화했습니다.");
    setBudgetFormMode("idle");
    setEditingBudgetId(null);
    setBudgetDraft(emptyBudgetDraft);
    setBudgetNotice("샘플 예산 정보로 초기화했습니다.");
    setSyncPin("");
    setCloudLastSaveAt(null);
    setCloudLastLoadAt(null);
    setCloudNotice("Supabase Free 공동 저장은 환경변수 설정 후 사용할 수 있습니다.");
    setFormNotice("샘플 데이터로 초기화했습니다.");
    setStorageNotice("데이터를 초기화하고 샘플 데이터로 복구했습니다.");
    setResetStorageToken((current) => current + 1);
  }

  function prepareConnector(label: string) {
    setConnectorNotice(`${label}은 다음 버전에서 연결 예정입니다. 현재는 mock 구조만 준비했습니다.`);
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-3">
          <Badge tone="blue">부부 금융 대시보드 v0.1</Badge>
          <div className="grid gap-2">
            <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              선택 기간 돈 흐름
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              카드, 계좌, 현금 거래를 한 화면에서 보고 기간 리포트로 정리하는 내부용 MVP입니다.
            </p>
          </div>
        </div>
        <Tabs active={activeTab} onChange={setActiveTab} />
      </header>

      <Card className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="grid gap-1">
              <h2 className="text-lg font-bold text-slate-950">기간 조회</h2>
              <p className="text-sm text-slate-500">
                {periodRangeText} · 선택 기간 거래 {filteredTransactions.length}건
              </p>
              <p className="text-xs font-semibold text-slate-400">{storageNotice}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{periodLabel}</Badge>
            <Button variant="secondary" onClick={resetStoredData}>
              <RotateCcw className="h-4 w-4" />
              데이터 초기화
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {periodOptions.map((option) => (
            <Button
              key={option.type}
              variant={periodFilter.periodType === option.type ? "primary" : "secondary"}
              onClick={() =>
                option.type === "custom"
                  ? selectCustomPeriod()
                  : selectPresetPeriod(option.type)
              }
            >
              {option.label}
            </Button>
          ))}
        </div>

        {periodFilter.periodType === "custom" && (
          <div className="grid gap-3 rounded-md bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <Field label="시작일">
              <Input
                type="date"
                value={customRange.startDate}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    startDate: event.target.value
                  }))
                }
              />
            </Field>
            <Field label="종료일">
              <Input
                type="date"
                value={customRange.endDate}
                onChange={(event) =>
                  setCustomRange((current) => ({
                    ...current,
                    endDate: event.target.value
                  }))
                }
              />
            </Field>
            <Button
              className="md:min-w-24"
              disabled={!customRange.startDate || !customRange.endDate}
              onClick={applyCustomPeriod}
            >
              적용
            </Button>
          </div>
        )}
      </Card>

      {activeTab === "overview" && (
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<Wallet className="h-5 w-5" />}
              label="총 잔고"
              value={formatKRW(totalBalance)}
              detail="3개 계좌 기준"
              tone="green"
            />
            <MetricCard
              icon={<TrendingUp className="h-5 w-5" />}
              label={periodSpendingLabel}
              value={formatKRW(totalSpending)}
              detail={`${filteredTransactions.length}건 거래`}
              tone="orange"
            />
            <MetricCard
              icon={<CreditCard className="h-5 w-5" />}
              label="카드 결제예정액"
              value={formatKRW(scheduledCardPayment)}
              detail="선택 기간 카드 거래"
              tone="blue"
            />
            <MetricCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="기간 리포트 상태"
              value="초안 준비"
              detail="텔레그램 발송 가능"
              tone="slate"
            />
          </section>

          <Card>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">이번 달 예산 진행률</h2>
                <p className="text-sm text-slate-500">
                  선택 기간 지출을 월간 카테고리 예산과 비교합니다.
                </p>
              </div>
              <Badge tone={budgetWarningCount > 0 ? "orange" : "green"}>
                {budgetWarningCount > 0 ? `주의 ${budgetWarningCount}개` : "정상"}
              </Badge>
            </div>

            <div className="grid gap-3">
              {budgetUsageRows.length === 0 && (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  예산 데이터가 없습니다.
                </div>
              )}
              {budgetUsageRows.map((row) => {
                const progress = Math.min(row.usageRate ?? 0, 100);

                return (
                  <div key={row.id} className="grid gap-2 rounded-md border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-950">{row.category}</p>
                        <p className="text-sm text-slate-500">
                          {formatKRW(row.spent)} /{" "}
                          {row.monthlyLimit === null
                            ? "예산 미설정"
                            : formatKRW(row.monthlyLimit)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={getBudgetStatusTone(row.status)}>
                          {getBudgetStatusLabel(row.status)}
                        </Badge>
                        <span className="text-sm font-bold text-slate-700">
                          {row.usageRate === null ? "-" : `${row.usageRate}%`}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn("h-full rounded-full", getBudgetBarColor(row.status))}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {periodLabel} 지출 흐름
                  </h2>
                  <p className="text-sm text-slate-500">날짜별 지출 합계</p>
                </div>
                <Badge tone="blue">{periodLabel}</Badge>
              </div>
              <ChartBox
                fallbackMessage={chartsReady ? "선택 기간 거래가 없습니다." : "차트 준비 중"}
                ready={chartsReady && weeklyFlowData.length > 0}
              >
                {({ height, width }) => (
                  <AreaChart
                    data={weeklyFlowData}
                    height={height}
                    margin={{ left: 4, right: 12 }}
                    width={width}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                      tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`}
                    />
                    <Tooltip
                      formatter={(value) => formatKRW(Number(value))}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#2563eb"
                      fill="#bfdbfe"
                      strokeWidth={3}
                    />
                  </AreaChart>
                )}
              </ChartBox>
            </Card>

            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">카테고리별 소비</h2>
                  <p className="text-sm text-slate-500">상위 소비 영역</p>
                </div>
                <Badge tone="green">{categoryData.length}개</Badge>
              </div>
              <ChartBox
                fallbackMessage={
                  chartsReady ? "선택 기간 소비 데이터가 없습니다." : "차트 준비 중"
                }
                ready={chartsReady && categoryData.length > 0}
              >
                {({ height, width }) => (
                  <PieChart height={height} width={width}>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatKRW(Number(value))} />
                  </PieChart>
                )}
              </ChartBox>
              <div className="grid gap-2">
                {categoryData.length === 0 && (
                  <p className="text-sm text-slate-500">선택 기간 카테고리 데이터가 없습니다.</p>
                )}
                {categoryData.slice(0, 4).map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      />
                      <span className="truncate">{category.name}</span>
                    </span>
                    <strong className="shrink-0 text-slate-900">
                      {formatKRW(category.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">남편/아내/공동 비교</h2>
                  <p className="text-sm text-slate-500">소유자별 지출 합계</p>
                </div>
                <Badge tone="orange">비교</Badge>
              </div>
              <ChartBox
                fallbackMessage={chartsReady ? "선택 기간 거래가 없습니다." : "차트 준비 중"}
                ready={chartsReady && filteredTransactions.length > 0}
              >
                {({ height, width }) => (
                  <BarChart
                    data={ownerData}
                    height={height}
                    margin={{ left: 4, right: 12 }}
                    width={width}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                      tickFormatter={(value) => `${Math.round(Number(value) / 10000)}만`}
                    />
                    <Tooltip formatter={(value) => formatKRW(Number(value))} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {ownerData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ChartBox>
            </Card>

            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">최근 거래내역</h2>
                  <p className="text-sm text-slate-500">선택 기간 최신 거래 8건</p>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab("transactions")}>
                  <Pencil className="h-4 w-4" />
                  메모 편집
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">날짜</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">소유</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">계좌</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">거래처</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">카테고리</th>
                      <th className="border-b border-slate-200 py-3 text-right font-semibold">금액</th>
                      <th className="border-b border-slate-200 py-3 pl-4 font-semibold">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="border-b border-slate-100 py-8 text-center text-slate-500"
                        >
                          선택 기간 거래가 없습니다.
                        </td>
                      </tr>
                    )}
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="text-slate-700">
                        <td className="border-b border-slate-100 py-3 pr-4">
                          {shortDate(transaction.date)}
                        </td>
                        <td className="border-b border-slate-100 py-3 pr-4">
                          <Badge
                            tone={
                              transaction.owner === "공동"
                                ? "green"
                                : transaction.owner === "남편"
                                  ? "blue"
                                  : "orange"
                            }
                          >
                            {transaction.owner}
                          </Badge>
                        </td>
                        <td className="border-b border-slate-100 py-3 pr-4">
                          {transaction.account}
                        </td>
                        <td className="border-b border-slate-100 py-3 pr-4 font-semibold text-slate-900">
                          {transaction.merchant}
                        </td>
                        <td className="border-b border-slate-100 py-3 pr-4">
                          {transaction.category}
                        </td>
                        <td className="border-b border-slate-100 py-3 text-right font-bold text-slate-950">
                          {formatKRW(transaction.amount)}
                        </td>
                        <td className="border-b border-slate-100 py-3 pl-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="min-h-8 px-3 py-1 text-xs"
                              variant="secondary"
                              onClick={() => startEditTransaction(transaction)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              수정
                            </Button>
                            <Button
                              className="min-h-8 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                              variant="ghost"
                              onClick={() => deleteTransaction(transaction)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">기간 메모</h2>
                  <p className="text-sm text-slate-500">리포트에 넣을 부부 공용 메모</p>
                </div>
              </div>
              <Textarea value={periodMemo} onChange={(event) => setPeriodMemo(event.target.value)} />
            </Card>

            <Card>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <Send className="h-5 w-5 text-blue-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">기간 리포트 미리보기</h2>
                    <p className="text-sm text-slate-500">텔레그램 발송 전 초안</p>
                  </div>
                </div>
                <Button disabled={telegramSending} onClick={sendTelegramReport}>
                  <Send className="h-4 w-4" />
                  {telegramSending ? "발송 중" : "텔레그램 발송"}
                </Button>
              </div>
              <div className="grid gap-3 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {reportLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="border-t border-slate-200 pt-3">{periodMemo}</p>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-500">{telegramNotice}</p>
            </Card>
          </section>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-6">
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <Plus className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">빠른 거래 추가</h2>
                  <p className="text-sm text-slate-500">오늘은 로컬 상태에만 저장됩니다.</p>
                </div>
              </div>
              <form className="grid gap-4" onSubmit={addTransaction}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="날짜">
                    <Input
                      type="date"
                      value={draft.date}
                      onChange={(event) => updateDraft("date", event.target.value)}
                    />
                  </Field>
                  <Field label="소유">
                    <SelectField
                      value={draft.owner}
                      onChange={(value) => updateDraft("owner", value)}
                      options={ownerOptions}
                    />
                  </Field>
                  <Field label="유형">
                    <SelectField
                      value={draft.type}
                      onChange={(value) => updateDraft("type", value)}
                      options={typeOptions}
                    />
                  </Field>
                  <Field label="계좌/카드">
                    <Input
                      value={draft.account}
                      onChange={(event) => updateDraft("account", event.target.value)}
                      placeholder="생활비카드"
                    />
                  </Field>
                  <Field label="거래처">
                    <Input
                      value={draft.merchant}
                      onChange={(event) => updateDraft("merchant", event.target.value)}
                      placeholder="예: 편의점"
                    />
                  </Field>
                  <Field label="카테고리">
                    <Input
                      value={draft.category}
                      onChange={(event) => updateDraft("category", event.target.value)}
                      placeholder="예: 식비"
                    />
                  </Field>
                  <Field label="금액">
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={draft.amount}
                      onChange={(event) => updateDraft("amount", event.target.value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
                <Field label="메모">
                  <Textarea
                    value={draft.memo}
                    onChange={(event) => updateDraft("memo", event.target.value)}
                    placeholder="거래 메모를 남겨주세요."
                  />
                </Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{formNotice}</p>
                  <Button type="submit">
                    <Plus className="h-4 w-4" />
                    거래 추가
                  </Button>
                </div>
              </form>
            </Card>

            <Card>
              <div className="mb-5 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">카드 알림 가져오기</h2>
                  <p className="text-sm text-slate-500">아이폰 카드 승인 알림을 붙여넣어 거래로 변환합니다.</p>
                </div>
              </div>
              <div className="grid gap-4">
                <Textarea
                  className="min-h-40"
                  value={notificationText}
                  onChange={(event) => setNotificationText(event.target.value)}
                  placeholder={`[국민카드] 05/16 14:22 이마트 52,000원 승인
[삼성카드] 05/15 10:12 소아과 18,700원 승인
[현대카드] 05/14 20:31 쿠팡 34,200원 승인`}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{importNotice}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={analyzeNotificationText}>
                      알림 내용 분석하기
                    </Button>
                    <Button
                      disabled={addableNotificationRows.length === 0}
                      onClick={addParsedNotificationsToTransactions}
                    >
                      거래내역에 추가
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">상태</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">날짜</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">시간</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">카드</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">사용처</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">분류</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">소유</th>
                        <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedSuccessRows.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                            분석 결과가 없습니다.
                          </td>
                        </tr>
                      )}
                      {parsedSuccessRows.map((row, index) => (
                        <tr
                          key={`${row.line}-${row.date}-${row.amount}-${index}`}
                          className="text-slate-700"
                        >
                          <td className="border-b border-slate-100 px-3 py-3">
                            <Badge tone={row.duplicate ? "orange" : "green"}>
                              {row.duplicate ? "중복" : "추가 가능"}
                            </Badge>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">{row.date}</td>
                          <td className="border-b border-slate-100 px-3 py-3">{row.time}</td>
                          <td className="border-b border-slate-100 px-3 py-3">{row.account}</td>
                          <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-900">
                            {row.merchant}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">{row.category}</td>
                          <td className="border-b border-slate-100 px-3 py-3">{row.owner}</td>
                          <td className="border-b border-slate-100 px-3 py-3 text-right font-bold text-slate-950">
                            {formatKRW(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {issueNotificationRows.length > 0 && (
                  <div className="grid gap-2 rounded-md bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-700">파싱 실패/제외된 줄</p>
                    {issueNotificationRows.map((row, index) => (
                      <div
                        key={`${row.status}-${row.line}-${index}`}
                        className="grid gap-1 rounded-md border border-slate-200 bg-white p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={row.status === "cancelled" ? "orange" : "slate"}>
                            {row.reason}
                          </Badge>
                          <span className="text-slate-500">{row.status}</span>
                        </div>
                        <p className="break-words text-slate-700">{row.line}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="mb-5 flex items-center gap-3">
                <FileUp className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">CSV 가져오기</h2>
                  <p className="text-sm text-slate-500">
                    카드사 사용내역 CSV를 서버 업로드 없이 브라우저에서 분석합니다.
                  </p>
                </div>
              </div>
              <div className="grid gap-4">
                <Field label="CSV 파일">
                  <Input type="file" accept=".csv,text/csv" onChange={handleCsvFileChange} />
                </Field>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid gap-1">
                    <p className="text-sm text-slate-500">{csvImportNotice}</p>
                    {csvFileName && (
                      <p className="text-xs font-semibold text-slate-400">{csvFileName}</p>
                    )}
                  </div>
                  <Button disabled={addableCsvRows.length === 0} onClick={addParsedCsvRowsToTransactions}>
                    거래내역에 추가
                  </Button>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-700">CSV 분석 결과 미리보기</p>
                    <Badge tone="blue">{parsedCsvSuccessRows.length}건</Badge>
                  </div>
                  <div className="overflow-x-auto rounded-md border border-slate-200">
                    <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500">
                          <th className="border-b border-slate-200 px-3 py-3 font-semibold">상태</th>
                          <th className="border-b border-slate-200 px-3 py-3 font-semibold">행</th>
                          <th className="border-b border-slate-200 px-3 py-3 font-semibold">날짜</th>
                          <th className="border-b border-slate-200 px-3 py-3 font-semibold">카드</th>
                          <th className="border-b border-slate-200 px-3 py-3 font-semibold">사용처</th>
                          <th className="border-b border-slate-200 px-3 py-3 font-semibold">분류</th>
                          <th className="border-b border-slate-200 px-3 py-3 font-semibold">소유</th>
                          <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedCsvSuccessRows.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                              CSV 분석 결과가 없습니다.
                            </td>
                          </tr>
                        )}
                        {parsedCsvSuccessRows.map((row, index) => (
                          <tr
                            key={`${row.rowNumber}-${row.date}-${row.account}-${row.merchant}-${index}`}
                            className="text-slate-700"
                          >
                            <td className="border-b border-slate-100 px-3 py-3">
                              <Badge tone={row.duplicate ? "orange" : "green"}>
                                {row.duplicate ? "중복" : "추가 가능"}
                              </Badge>
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3">
                              {row.rowNumber}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3">{row.date}</td>
                            <td className="border-b border-slate-100 px-3 py-3">{row.account}</td>
                            <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-900">
                              {row.merchant}
                            </td>
                            <td className="border-b border-slate-100 px-3 py-3">{row.category}</td>
                            <td className="border-b border-slate-100 px-3 py-3">{row.owner}</td>
                            <td className="border-b border-slate-100 px-3 py-3 text-right font-bold text-slate-950">
                              {formatKRW(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {failedCsvRows.length > 0 && (
                  <div className="grid gap-2 rounded-md bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-700">실패한 행</p>
                    {failedCsvRows.map((row, index) => (
                      <div
                        key={`${row.rowNumber}-${row.reason}-${index}`}
                        className="grid gap-1 rounded-md border border-slate-200 bg-white p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="slate">{row.rowNumber}행</Badge>
                          <span className="font-semibold text-slate-700">{row.reason}</span>
                        </div>
                        <p className="break-words text-slate-500">{row.raw || "(빈 행)"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <Pencil className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">거래 수정</h2>
                  <p className="text-sm text-slate-500">선택한 거래의 날짜, 분류, 금액, 메모를 고칩니다.</p>
                </div>
              </div>

              {!editingTransactionId && (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  최근 거래내역 또는 아래 거래 카드에서 수정 버튼을 눌러주세요.
                </div>
              )}

              {editingTransactionId && (
                <form className="grid gap-4" onSubmit={saveEditedTransaction}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="날짜">
                      <Input
                        type="date"
                        value={editDraft.date}
                        onChange={(event) => updateEditDraft("date", event.target.value)}
                      />
                    </Field>
                    <Field label="사용자">
                      <SelectField
                        value={editDraft.owner}
                        onChange={(value) => updateEditDraft("owner", value)}
                        options={ownerOptions}
                      />
                    </Field>
                    <Field label="유형">
                      <SelectField
                        value={editDraft.type}
                        onChange={(value) => updateEditDraft("type", value)}
                        options={typeOptions}
                      />
                    </Field>
                    <Field label="계좌/카드명">
                      <Input
                        value={editDraft.account}
                        onChange={(event) => updateEditDraft("account", event.target.value)}
                        placeholder="생활비카드"
                      />
                    </Field>
                    <Field label="사용처">
                      <Input
                        value={editDraft.merchant}
                        onChange={(event) => updateEditDraft("merchant", event.target.value)}
                        placeholder="예: 이마트"
                      />
                    </Field>
                    <Field label="카테고리">
                      <Input
                        value={editDraft.category}
                        onChange={(event) => updateEditDraft("category", event.target.value)}
                        placeholder="예: 생활/마트"
                      />
                    </Field>
                    <Field label="금액">
                      <Input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={editDraft.amount}
                        onChange={(event) => updateEditDraft("amount", event.target.value)}
                        placeholder="0"
                      />
                    </Field>
                  </div>
                  <Field label="메모">
                    <Textarea
                      className="min-h-24"
                      value={editDraft.memo}
                      onChange={(event) => updateEditDraft("memo", event.target.value)}
                      placeholder="거래 메모를 남겨주세요."
                    />
                  </Field>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">{editNotice}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={cancelEditTransaction}>
                        <X className="h-4 w-4" />
                        취소
                      </Button>
                      <Button type="submit">
                        <Save className="h-4 w-4" />
                        저장
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </Card>

            <Card>
              <div className="mb-5 flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">거래별 메모</h2>
                  <p className="text-sm text-slate-500">선택 기간 거래에 설명을 붙입니다.</p>
                </div>
              </div>
              <div className="grid gap-3">
                {sortedFilteredTransactions.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    선택 기간 거래가 없습니다.
                  </div>
                )}
                {sortedFilteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid gap-3 rounded-md border border-slate-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {transaction.merchant} · {formatKRW(transaction.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {shortDate(transaction.date)} · {transaction.owner} ·{" "}
                          {transaction.category}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="slate">{transaction.type}</Badge>
                        <Button
                          className="min-h-8 px-3 py-1 text-xs"
                          variant="secondary"
                          onClick={() => startEditTransaction(transaction)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          수정
                        </Button>
                        <Button
                          className="min-h-8 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                          variant="ghost"
                          onClick={() => deleteTransaction(transaction)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          삭제
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={transaction.memo}
                      onChange={(event) =>
                        updateTransactionMemo(transaction.id, event.target.value)
                      }
                      className="min-h-20"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{account.owner}</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-950">{account.name}</h2>
                    <p className="text-sm text-slate-500">{account.bank}</p>
                  </div>
                  <Landmark className="h-5 w-5 text-blue-600" />
                </div>
                <p className="mb-3 text-2xl font-bold text-slate-950">
                  {formatKRW(account.balance)}
                </p>
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={account.status === "수기 입력" ? "green" : "orange"}>
                      {account.status}
                    </Badge>
                    {account.memo && (
                      <span className="text-xs font-semibold text-slate-400">{account.memo}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-h-8 px-3 py-1 text-xs"
                      variant="secondary"
                      onClick={() => startEditAccount(account)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </Button>
                    <Button
                      className="min-h-8 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      variant="ghost"
                      onClick={() => deleteAccount(account)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <Card>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">계좌 관리</h2>
                  <p className="text-sm text-slate-500">
                    은행 API 연동 전까지 계좌명, 은행명, 잔고와 상태를 수기로 관리합니다.
                  </p>
                </div>
              </div>
              <Button onClick={startAddAccount}>
                <Plus className="h-4 w-4" />
                계좌 추가
              </Button>
            </div>

            {accountFormMode === "idle" && (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                계좌 카드의 수정 버튼을 누르거나 새 계좌를 추가해주세요.
              </div>
            )}

            {accountFormMode !== "idle" && (
              <form className="grid gap-4" onSubmit={saveAccount}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="사용자">
                    <SelectField
                      value={accountDraft.owner}
                      onChange={(value) => updateAccountDraft("owner", value)}
                      options={ownerOptions}
                    />
                  </Field>
                  <Field label="계좌명">
                    <Input
                      value={accountDraft.name}
                      onChange={(event) => updateAccountDraft("name", event.target.value)}
                      placeholder="예: 급여통장"
                    />
                  </Field>
                  <Field label="은행명">
                    <Input
                      value={accountDraft.bank}
                      onChange={(event) => updateAccountDraft("bank", event.target.value)}
                      placeholder="예: 국민은행"
                    />
                  </Field>
                  <Field label="잔고">
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={accountDraft.balance}
                      onChange={(event) => updateAccountDraft("balance", event.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="상태">
                    <Input
                      value={accountDraft.status}
                      onChange={(event) => updateAccountDraft("status", event.target.value)}
                      placeholder="수기 입력"
                    />
                  </Field>
                  <Field label="메모">
                    <Input
                      value={accountDraft.memo}
                      onChange={(event) => updateAccountDraft("memo", event.target.value)}
                      placeholder="예: 비상금 계좌"
                    />
                  </Field>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{accountNotice}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={cancelAccountForm}>
                      <X className="h-4 w-4" />
                      취소
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4" />
                      저장
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>

          <Card>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">예산 관리</h2>
                  <p className="text-sm text-slate-500">
                    월간 카테고리별 예산을 설정하고 초과 위험을 확인합니다.
                  </p>
                </div>
              </div>
              <Button onClick={startAddBudget}>
                <Plus className="h-4 w-4" />
                예산 추가
              </Button>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {budgets.map((budget) => (
                <div key={budget.id} className="grid gap-3 rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">{budget.category}</p>
                      <p className="text-sm text-slate-500">{formatKRW(budget.monthlyLimit)}</p>
                      {budget.memo && (
                        <p className="mt-1 text-xs font-semibold text-slate-400">{budget.memo}</p>
                      )}
                    </div>
                    <Badge tone="blue">월 예산</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-h-8 px-3 py-1 text-xs"
                      variant="secondary"
                      onClick={() => startEditBudget(budget)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </Button>
                    <Button
                      className="min-h-8 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      variant="ghost"
                      onClick={() => deleteBudget(budget)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {budgetFormMode === "idle" && (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                예산 카드의 수정 버튼을 누르거나 새 예산을 추가해주세요.
              </div>
            )}

            {budgetFormMode !== "idle" && (
              <form className="grid gap-4" onSubmit={saveBudget}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="카테고리명">
                    <Input
                      value={budgetDraft.category}
                      onChange={(event) => updateBudgetDraft("category", event.target.value)}
                      placeholder="예: 식비"
                    />
                  </Field>
                  <Field label="월 예산">
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={budgetDraft.monthlyLimit}
                      onChange={(event) => updateBudgetDraft("monthlyLimit", event.target.value)}
                      placeholder="0"
                    />
                  </Field>
                  <Field label="메모">
                    <Input
                      value={budgetDraft.memo}
                      onChange={(event) => updateBudgetDraft("memo", event.target.value)}
                      placeholder="예: 외식 포함"
                    />
                  </Field>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{budgetNotice}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={cancelBudgetForm}>
                      <X className="h-4 w-4" />
                      취소
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4" />
                      저장
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-950">클라우드 공동 저장</h2>
                <p className="text-sm text-slate-500">
                  이 기능은 부부가 여러 기기에서 같은 데이터를 보기 위한 공동 저장 기능입니다.
                </p>
                <p className="text-sm text-slate-500">
                  초기 버전은 로그인 대신 동기화 PIN으로 보호합니다.
                </p>
                <p className="text-sm text-slate-500">
                  Supabase Free 기준으로 시작하며, localStorage 백업은 계속 유지됩니다.
                </p>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-800">
                  마지막 클라우드 저장: {formatDateTime(cloudLastSaveAt)}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-800">
                  마지막 클라우드 불러오기: {formatDateTime(cloudLastLoadAt)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <Field label="동기화 PIN">
                <Input
                  type="password"
                  value={syncPin}
                  onChange={(event) => setSyncPin(event.target.value)}
                  placeholder="APP_SYNC_PIN"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button disabled={cloudSyncing} onClick={saveCloudSnapshot}>
                  <CloudUpload className="h-4 w-4" />
                  {cloudSyncing ? "처리 중" : "클라우드에 저장"}
                </Button>
                <Button disabled={cloudSyncing} variant="secondary" onClick={loadCloudSnapshot}>
                  <CloudDownload className="h-4 w-4" />
                  클라우드에서 불러오기
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
              <p>{cloudNotice}</p>
              <p>
                저장 범위: 거래 {transactions.length}건, 계좌 {accounts.length}개, 예산{" "}
                {budgets.length}개, 기간 메모
              </p>
            </div>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <Plug className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">API 연동 준비</h2>
                  <p className="text-sm text-slate-500">실제 금융 API 키는 넣지 않았습니다.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">CODEF 계좌/카드 조회</p>
                    <p className="text-sm text-slate-500">lib/connectors/codef.ts</p>
                  </div>
                  <Button variant="secondary" onClick={() => prepareConnector("CODEF")}>
                    <Database className="h-4 w-4" />
                    연결 예정
                  </Button>
                </div>
                <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">Hyphen 결제예정액</p>
                    <p className="text-sm text-slate-500">lib/connectors/hyphen.ts</p>
                  </div>
                  <Button variant="secondary" onClick={() => prepareConnector("Hyphen")}>
                    <CreditCard className="h-4 w-4" />
                    연결 예정
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-5 flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">시트/알림 연동 준비</h2>
                  <p className="text-sm text-slate-500">수기 데이터 백업과 리포트 발송 자리입니다.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">Google Sheets 동기화</p>
                    <p className="text-sm text-slate-500">lib/connectors/googleSheets.ts</p>
                  </div>
                  <Button variant="secondary" onClick={() => prepareConnector("Google Sheets")}>
                    <FileSpreadsheet className="h-4 w-4" />
                    연결 예정
                  </Button>
                </div>
                <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">Telegram 리포트 발송</p>
                    <p className="text-sm text-slate-500">
                      app/api/telegram/route.ts · 환경변수 필요
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setConnectorNotice(
                        "Telegram Bot API route가 준비되었습니다. TELEGRAM_BOT_TOKEN과 TELEGRAM_CHAT_ID를 설정하면 리포트에서 발송할 수 있습니다."
                      )
                    }
                  >
                    <Send className="h-4 w-4" />
                    환경변수 필요
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          <Card>
            <div className="mb-5 flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-950">구글시트 CSV 백업/복구</h2>
                <p className="text-sm text-slate-500">
                  CSV를 구글시트에 업로드해 백업하거나 수기 수정 후 다시 가져올 수 있습니다.
                </p>
                <p className="text-sm text-slate-500">
                  구글시트 API 직접 연동은 다음 단계에서 진행합니다.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_1fr]">
                <div className="grid gap-3 rounded-md bg-white p-4">
                  <div>
                    <p className="font-bold text-slate-950">CSV 백업 내보내기</p>
                    <p className="text-sm text-slate-500">
                      현재 저장된 전체 거래 {transactions.length}건을 백업 파일로 저장합니다.
                    </p>
                  </div>
                  <Button className="w-full sm:w-fit" onClick={exportTransactionsBackupCsv}>
                    <Download className="h-4 w-4" />
                    CSV 백업 내보내기
                  </Button>
                </div>

                <div className="grid gap-3 rounded-md bg-white p-4">
                  <Field label="백업 CSV 다시 가져오기">
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleBackupCsvFileChange}
                    />
                  </Field>
                  <Button
                    className="w-full sm:w-fit"
                    disabled={addableBackupCsvRows.length === 0}
                    onClick={applyBackupCsvRowsToTransactions}
                  >
                    <FileUp className="h-4 w-4" />
                    백업 CSV 거래내역에 추가
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-1">
                  <p className="text-sm text-slate-500">{backupCsvNotice}</p>
                  {backupCsvFileName && (
                    <p className="text-xs font-semibold text-slate-400">{backupCsvFileName}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="green">추가 {addableBackupCsvRows.length}건</Badge>
                  <Badge tone="orange">
                    중복{" "}
                    {
                      parsedBackupCsvSuccessRows.filter((row) => row.action === "duplicate")
                        .length
                    }
                    건
                  </Badge>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-700">백업 CSV 미리보기</p>
                  <Badge tone="blue">{parsedBackupCsvSuccessRows.length}건</Badge>
                </div>
                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">상태</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">행</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">id</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">날짜</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">소유</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">유형</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">계좌</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">사용처</th>
                        <th className="border-b border-slate-200 px-3 py-3 font-semibold">분류</th>
                        <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedBackupCsvSuccessRows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                            백업 CSV 분석 결과가 없습니다.
                          </td>
                        </tr>
                      )}
                      {parsedBackupCsvSuccessRows.map((row) => (
                        <tr key={`${row.rowNumber}-${row.transaction.id}`} className="text-slate-700">
                          <td className="border-b border-slate-100 px-3 py-3">
                            <Badge tone={getBackupCsvActionTone(row.action)}>
                              {getBackupCsvActionLabel(row.action)}
                            </Badge>
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">{row.rowNumber}</td>
                          <td className="border-b border-slate-100 px-3 py-3 font-mono text-xs">
                            {row.transaction.id}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.transaction.date}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.transaction.owner}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.transaction.type}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.transaction.account}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-900">
                            {row.transaction.merchant}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3">
                            {row.transaction.category}
                          </td>
                          <td className="border-b border-slate-100 px-3 py-3 text-right font-bold text-slate-950">
                            {formatKRW(row.transaction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {failedBackupCsvRows.length > 0 && (
                <div className="grid gap-2 rounded-md bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-700">실패한 행</p>
                  {failedBackupCsvRows.map((row, index) => (
                    <div
                      key={`${row.rowNumber}-${row.reason}-${index}`}
                      className="grid gap-1 rounded-md border border-slate-200 bg-white p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="slate">{row.rowNumber}행</Badge>
                        <span className="font-semibold text-slate-700">{row.reason}</span>
                      </div>
                      <p className="break-words text-slate-500">{row.raw || "(빈 행)"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">연동 상태</h2>
                <p className="text-sm text-slate-500">{connectorNotice}</p>
              </div>
              <Badge tone="slate">placeholder only</Badge>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
