import type { RecognitionAttachment } from '../model/incentive';

export function RecognitionMaterials({ attachments }: { attachments?: RecognitionAttachment[] }) {
  const items = attachments ?? [];
  if (!items.length) return null;

  return (
    <ul className="incentive-record-files">
      {items.map((item) => (
        <li key={item.name}>
          <a href={item.url} download={item.name} aria-label={`下载 ${item.name}`}>
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
