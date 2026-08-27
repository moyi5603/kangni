import { HonorEmbedApp } from '../HonorRuntime';
import '../../activities/styles.css';
import '../styles.css';

export function H5HonorApp({ initialRole = 'employee' }: { initialRole?: 'employee' | 'hr' }) {
  return (
    <div className="c-h5-shell is-honor c-honor-h5">
      <div className="c-h5-frame">
        <HonorEmbedApp initialRole={initialRole} />
      </div>
    </div>
  );
}
