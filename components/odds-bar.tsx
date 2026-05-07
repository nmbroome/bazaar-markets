interface OddsBarProps {
  yesProbability: number;
}

export function OddsBar({ yesProbability }: OddsBarProps) {
  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          YES {yesPct}%
        </span>
        <span className="text-rose-600 dark:text-rose-400 font-medium">
          NO {noPct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden bg-muted flex">
        <div className="bg-emerald-500" style={{ width: `${yesPct}%` }} />
        <div className="bg-rose-500" style={{ width: `${noPct}%` }} />
      </div>
    </div>
  );
}
