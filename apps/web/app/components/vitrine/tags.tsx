import type { ReactNode } from 'react';

export function Tags({
  labels,
  lettering,
}: {
  labels: string[];
  lettering?: ReactNode;
}) {
  return (
    <ul className="vitrine-tags">
      {labels.map((label) => (
        <li key={label}>{label}</li>
      ))}
      {lettering && <li className="vitrine-tags-lettering">{lettering}</li>}
    </ul>
  );
}
