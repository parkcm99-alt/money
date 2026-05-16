export type HyphenCardSnapshot = {
  provider: "hyphen";
  connected: false;
  message: string;
};

export async function fetchHyphenCardPayments(): Promise<HyphenCardSnapshot> {
  // TODO: Hyphen 카드 결제예정액 API 연동 시 서버 전용 connector로 교체한다.
  return {
    provider: "hyphen",
    connected: false,
    message: "Hyphen API 연결 예정"
  };
}
