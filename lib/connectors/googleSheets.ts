export type GoogleSheetsSyncResult = {
  provider: "googleSheets";
  connected: false;
  message: string;
};

export async function syncTransactionsToGoogleSheets(): Promise<GoogleSheetsSyncResult> {
  // TODO: Google Sheets API OAuth 및 시트 범위 쓰기 로직을 추가한다.
  return {
    provider: "googleSheets",
    connected: false,
    message: "Google Sheets 동기화 연결 예정"
  };
}
