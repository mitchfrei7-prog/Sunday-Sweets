export default function MorePage() {
  const items = [
    { label: "Flour blends", note: "Coming with the bake flow" },
    { label: "Hall of fame", note: "Phase 4" },
    { label: "Pricing calculator", note: "Phase 4" },
    { label: "Export data", note: "Coming soon" },
  ];

  return (
    <main className="px-4 pt-8">
      <h1 className="text-3xl">More</h1>
      <ul className="mt-5 space-y-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-baseline justify-between rounded-xl border border-butter-dark bg-white/60 px-4 py-3"
          >
            <span className="font-medium">{item.label}</span>
            <span className="text-xs text-latte">{item.note}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
