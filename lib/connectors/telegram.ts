export type TelegramPreviewResult = {
  provider: "telegram";
  connected: false;
  message: string;
};

export async function sendWeeklyReportPreview(): Promise<TelegramPreviewResult> {
  // TODO: Telegram Bot API 토큰을 환경 변수로 읽고 주간 리포트 발송을 구현한다.
  return {
    provider: "telegram",
    connected: false,
    message: "Telegram 알림 연결 예정"
  };
}
