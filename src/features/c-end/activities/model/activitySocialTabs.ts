export function shouldShowMomentsTab(momentCount: number, canSubmit: boolean): boolean {
  return momentCount > 0 || canSubmit;
}
