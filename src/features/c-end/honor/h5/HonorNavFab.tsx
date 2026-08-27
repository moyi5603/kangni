type HonorNavFabProps = {
  atRoot: boolean;
  onBack: () => void;
  onHome: () => void;
};

export function HonorNavFab({ atRoot, onBack, onHome }: HonorNavFabProps) {
  if (atRoot) {
    return (
      <nav className="c-h5-detail-fab is-home" aria-label="页面导航">
        <button type="button" onClick={onHome}>
          回主页
        </button>
      </nav>
    );
  }

  return (
    <nav className="c-h5-detail-fab" aria-label="页面导航">
      <button type="button" onClick={onBack}>
        返回上一页
      </button>
      <button type="button" onClick={onHome}>
        回主页
      </button>
    </nav>
  );
}
