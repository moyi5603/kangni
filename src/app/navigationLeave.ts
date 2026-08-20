type LeaveHandler = (proceed: () => void) => void;

let handler: LeaveHandler | null = null;
let suppressingHash = false;

export function setNavigationLeaveHandler(next: LeaveHandler | null) {
  handler = next;
}

export function requestNavigation(proceed: () => void) {
  if (!handler) {
    proceed();
    return;
  }
  handler(proceed);
}

export function beginSuppressHash() {
  suppressingHash = true;
}

export function consumeSuppressHash(): boolean {
  if (!suppressingHash) return false;
  suppressingHash = false;
  return true;
}
