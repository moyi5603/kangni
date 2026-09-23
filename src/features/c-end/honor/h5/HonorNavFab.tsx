type HonorNavFabProps = {
  atRoot: boolean;
  onBack: () => void;
  onHome: () => void;
};

/** H5 floating nav removed globally. Component kept so honor runtime wiring stays a no-op. */
export function HonorNavFab(_props: HonorNavFabProps) {
  return null;
}
