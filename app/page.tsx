"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Database,
  FileSpreadsheet,
  FileText,
  Landmark,
  Pencil,
  Plug,
  Plus,
  Send,
  TrendingUp,
  Wallet
} from "lucide-react";
import type {
  Account,
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

const accounts: Account[] = [
  {
    owner: "남편",
    name: "급여통장",
    bank: "국민은행",
    balance: 4120000,
    status: "API 예정"
  },
  {
    owner: "아내",
    name: "생활통장",
    bank: "카카오뱅크",
    balance: 3100000,
    status: "API 예정"
  },
  {
    owner: "공동",
    name: "공동생활비",
    bank: "토스뱅크",
    balance: 1200000,
    status: "수기 입력"
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

const defaultPeriodFilter: PeriodFilter = {
  periodType: "week",
  ...getPresetDateRange("week")
};

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>(defaultPeriodFilter);
  const [customRange, setCustomRange] = useState({
    startDate: defaultPeriodFilter.startDate,
    endDate: defaultPeriodFilter.endDate
  });
  const [chartsReady, setChartsReady] = useState(false);
  const [draft, setDraft] = useState<DraftTransaction>(emptyDraft);
  const [periodMemo, setPeriodMemo] = useState(
    "이번 기간은 주거비와 생활/마트 지출이 컸다. 다음 기간은 식비 예산을 먼저 확인하고 장보기 횟수를 줄여보기."
  );
  const [formNotice, setFormNotice] = useState("샘플 데이터로 시작했습니다.");
  const [connectorNotice, setConnectorNotice] = useState("아직 외부 API는 연결하지 않았습니다.");

  const totalBalance = useMemo(() => getTotalBalance(accounts), []);
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
  const recentTransactions = useMemo(
    () => [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [filteredTransactions]
  );
  const periodLabel = getPeriodLabel(periodFilter.periodType);
  const periodSpendingLabel = getPeriodSpendingLabel(periodFilter.periodType);
  const periodRangeText = `${formatPeriodDate(periodFilter.startDate)} ~ ${formatPeriodDate(
    periodFilter.endDate
  )}`;
  const topCategory = categoryData[0];
  const reportLines = [
    `리포트 기간: ${periodRangeText}`,
    `${periodSpendingLabel}은 ${formatKRW(totalSpending)}입니다.`,
    topCategory
      ? `가장 큰 카테고리는 ${topCategory.name}이며 ${formatKRW(topCategory.amount)}를 사용했습니다.`
      : "아직 카테고리 데이터가 없습니다.",
    `카드 결제예정액은 ${formatKRW(scheduledCardPayment)}입니다.`,
    "외부 API, 구글시트, 텔레그램 발송은 다음 단계에서 연결합니다."
  ];

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
            </div>
          </div>
          <Badge tone="blue">{periodLabel}</Badge>
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
              detail="텔레그램 발송 예정"
              tone="slate"
            />
          </section>

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
              <div className="h-72">
                {chartsReady && weeklyFlowData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyFlowData} margin={{ left: 4, right: 12 }}>
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
                  </ResponsiveContainer>
                ) : (
                  <ChartFallback
                    message={chartsReady ? "선택 기간 거래가 없습니다." : "차트 준비 중"}
                  />
                )}
              </div>
            </Card>

            <Card>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">카테고리별 소비</h2>
                  <p className="text-sm text-slate-500">상위 소비 영역</p>
                </div>
                <Badge tone="green">{categoryData.length}개</Badge>
              </div>
              <div className="h-72">
                {chartsReady && categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={92}
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatKRW(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartFallback
                    message={chartsReady ? "선택 기간 소비 데이터가 없습니다." : "차트 준비 중"}
                  />
                )}
              </div>
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
              <div className="h-72">
                {chartsReady && filteredTransactions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ownerData} margin={{ left: 4, right: 12 }}>
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
                          <Cell
                            key={entry.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartFallback
                    message={chartsReady ? "선택 기간 거래가 없습니다." : "차트 준비 중"}
                  />
                )}
              </div>
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
                <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">날짜</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">소유</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">계좌</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">거래처</th>
                      <th className="border-b border-slate-200 py-3 pr-4 font-semibold">카테고리</th>
                      <th className="border-b border-slate-200 py-3 text-right font-semibold">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
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
              <div className="mb-4 flex items-center gap-3">
                <Send className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">기간 리포트 미리보기</h2>
                  <p className="text-sm text-slate-500">텔레그램 발송 전 초안</p>
                </div>
              </div>
              <div className="grid gap-3 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {reportLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p className="border-t border-slate-200 pt-3">{periodMemo}</p>
              </div>
            </Card>
          </section>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
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

          <div className="grid gap-6">
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-950">거래별 메모</h2>
                  <p className="text-sm text-slate-500">선택 기간 거래에 설명을 붙입니다.</p>
                </div>
              </div>
              <div className="grid gap-3">
                {recentTransactions.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    선택 기간 거래가 없습니다.
                  </div>
                )}
                {recentTransactions.map((transaction) => (
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
                      <Badge tone="slate">{transaction.type}</Badge>
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
              <Card key={`${account.owner}-${account.name}`}>
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
                <Badge tone={account.status === "수기 입력" ? "green" : "orange"}>
                  {account.status}
                </Badge>
              </Card>
            ))}
          </section>

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
                    <p className="text-sm text-slate-500">lib/connectors/telegram.ts</p>
                  </div>
                  <Button variant="secondary" onClick={() => prepareConnector("Telegram")}>
                    <Send className="h-4 w-4" />
                    연결 예정
                  </Button>
                </div>
              </div>
            </Card>
          </section>

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
