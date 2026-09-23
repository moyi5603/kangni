const numericByString = new Map<string, number>();
const stringByNumeric = new Map<number, string>();
let nextId = 1;

export function badgeTreeNumericId(id: string): number {
  const existing = numericByString.get(id);
  if (existing != null) return existing;
  const numeric = nextId;
  nextId += 1;
  numericByString.set(id, numeric);
  stringByNumeric.set(numeric, id);
  return numeric;
}

export function badgeTreeStringId(numericId: number): string | undefined {
  return stringByNumeric.get(numericId);
}

export function readTreeQueryFromHash(hash?: string): string | null {
  const value = hash ?? (typeof window === 'undefined' ? '' : window.location.hash);
  const path = value.replace(/^#/, '');
  const queryString = path.includes('?') ? path.split('?')[1] : '';
  return new URLSearchParams(queryString).get('tree');
}

export function writeTreeQueryToHash(treeId: string | null, hash?: string): string | null {
  if (typeof window === 'undefined') return null;
  const value = hash ?? window.location.hash;
  const raw = value.startsWith('#') ? value.slice(1) : value;
  if (!raw.includes('incentive-badges')) return null;
  const [pathname, queryString] = raw.split('?');
  const params = new URLSearchParams(queryString ?? '');
  if (treeId) params.set('tree', treeId);
  else params.delete('tree');
  const qs = params.toString();
  const next = `#${pathname}${qs ? `?${qs}` : ''}`;
  if (window.location.hash !== next) {
    window.location.hash = next;
  }
  return next;
}
