export type PcMallHeroStat = {
  label: string;
  value: string;
};

export function PcMallHero({
  tone,
  kicker,
  title,
  stats,
}: {
  tone: 'course' | 'exam';
  kicker: string;
  title: string;
  stats: PcMallHeroStat[];
}) {
  return (
    <section className={`c-pc-mall-hero is-${tone}`} aria-label={title}>
      <div className="c-pc-mall-hero-copy">
        <p className="c-pc-mall-hero-kicker">{kicker}</p>
        <h2 className="c-pc-mall-hero-title">{title}</h2>
      </div>
      <ul className="c-pc-mall-hero-stats">
        {stats.map((item) => (
          <li key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
