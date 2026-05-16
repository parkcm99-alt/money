export type CodefAccountSnapshot = {
  provider: "codef";
  connected: false;
  message: string;
};

export async function fetchCodefAccounts(): Promise<CodefAccountSnapshot> {
  // TODO: CODEF 계좌/카드 API 연동 시 환경 변수 기반 인증을 추가한다.
  return {
    provider: "codef",
    connected: false,
    message: "CODEF API 연결 예정"
  };
}
