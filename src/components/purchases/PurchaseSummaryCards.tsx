interface PurchaseSummaryCardsProps {
  inProgressCount: number;
  pendingCount: number;
  completedCount: number;
}

const PurchaseSummaryCards: React.FC<PurchaseSummaryCardsProps> = ({
  inProgressCount,
  pendingCount,
  completedCount,
}) => {
  const stats = [
    { label: 'Em progresso', value: inProgressCount },
    { label: 'Pendentes', value: pendingCount },
    { label: 'Concluídas', value: completedCount },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          // Dark, translucent on the mobile hero (green background);
          // light green surface once the desktop header is plain (print 12).
          className="rounded-2xl border border-white/10 bg-white/10 p-4 md:border-border md:bg-secondary"
        >
          <p className="text-2xl font-bold text-white md:text-foreground">
            {stat.value}
          </p>
          <p className="text-xs text-tosho-200 md:text-muted-foreground">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PurchaseSummaryCards;
