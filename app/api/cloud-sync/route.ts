import { NextResponse } from "next/server";
import { createSupabaseServerClient, hasCloudSyncEnv } from "../../../lib/supabase/server";

type FinanceSnapshotData = {
  accounts: unknown[];
  budgets: unknown[];
  periodMemo: string;
  transactions: unknown[];
};

type CloudSyncPostBody = {
  data?: unknown;
  pin?: unknown;
};

const missingEnvResponse = {
  ok: false,
  message: "Supabase 환경변수가 설정되지 않았습니다."
} as const;

function getRequestPin(request: Request, bodyPin?: unknown) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization");

  if (typeof bodyPin === "string") {
    return bodyPin;
  }

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return (
    request.headers.get("x-sync-pin") ??
    request.headers.get("x-app-sync-pin") ??
    url.searchParams.get("pin") ??
    ""
  );
}

function isAuthorized(pin: string) {
  return Boolean(process.env.APP_SYNC_PIN && pin === process.env.APP_SYNC_PIN);
}

function isFinanceSnapshotData(value: unknown): value is FinanceSnapshotData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FinanceSnapshotData>;

  return (
    Array.isArray(candidate.transactions) &&
    Array.isArray(candidate.accounts) &&
    Array.isArray(candidate.budgets) &&
    typeof candidate.periodMemo === "string"
  );
}

function getCloudSyncConfig() {
  if (!hasCloudSyncEnv()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const householdId = process.env.FINANCE_HOUSEHOLD_ID;

  if (!supabase || !householdId) {
    return null;
  }

  return { householdId, supabase };
}

export async function GET(request: Request) {
  const config = getCloudSyncConfig();

  if (!config) {
    return NextResponse.json(missingEnvResponse);
  }

  if (!isAuthorized(getRequestPin(request))) {
    return NextResponse.json(
      { ok: false, message: "동기화 PIN이 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const { data, error } = await config.supabase
    .from("finance_snapshots")
    .select("data, updated_at")
    .eq("household_id", config.householdId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({
      ok: false,
      message: error.message || "Supabase에서 클라우드 데이터를 불러오지 못했습니다."
    });
  }

  if (!data) {
    return NextResponse.json({
      ok: true,
      data: null,
      message: "저장된 클라우드 데이터가 없습니다."
    });
  }

  return NextResponse.json({
    ok: true,
    data: data.data,
    message: "클라우드 데이터를 불러왔습니다.",
    updatedAt: data.updated_at
  });
}

export async function POST(request: Request) {
  const config = getCloudSyncConfig();

  if (!config) {
    return NextResponse.json(missingEnvResponse);
  }

  let body: CloudSyncPostBody;

  try {
    body = (await request.json()) as CloudSyncPostBody;
  } catch {
    return NextResponse.json({
      ok: false,
      message: "요청 본문을 읽을 수 없습니다."
    });
  }

  if (!isAuthorized(getRequestPin(request, body.pin))) {
    return NextResponse.json(
      { ok: false, message: "동기화 PIN이 올바르지 않습니다." },
      { status: 401 }
    );
  }

  if (!isFinanceSnapshotData(body.data)) {
    return NextResponse.json({
      ok: false,
      message: "저장할 데이터 구조가 올바르지 않습니다."
    });
  }

  const updatedAt = new Date().toISOString();
  const { error } = await config.supabase.from("finance_snapshots").upsert({
    data: body.data,
    household_id: config.householdId,
    updated_at: updatedAt
  });

  if (error) {
    return NextResponse.json({
      ok: false,
      message: error.message || "Supabase 저장에 실패했습니다."
    });
  }

  return NextResponse.json({
    ok: true,
    message: "클라우드에 저장했습니다.",
    updatedAt
  });
}
