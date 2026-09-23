export function ForumPhotoGrid({
  images,
  className,
  cells,
  onOpen,
}: {
  images: string[];
  className: string;
  cells?: { src: string; extra: number }[];
  onOpen: (index: number) => void;
}) {
  const shown = cells ?? images.map((src) => ({ src, extra: 0 }));
  if (!shown.length) return null;
  return (
    <ul className={className}>
      {shown.map((cell, index) => (
        <li key={`${cell.src}-${index}`}>
          <button
            type="button"
            aria-label="查看大图"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpen(index);
            }}
          >
            <img src={cell.src} alt="" />
            {cell.extra > 0 ? <span className="c-forum-thumbs-more">+{cell.extra}张</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
