import { ReactNode } from "react";

export function StatCard({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
        </div>
        {icon ? <div className="rounded-md bg-mint p-3 text-forest">{icon}</div> : null}
      </div>
    </div>
  );
}
