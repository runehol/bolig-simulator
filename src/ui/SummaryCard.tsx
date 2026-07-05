export function SummaryCard({
  explanation,
  label,
  value,
}: {
  explanation: string;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#ddd8cd] bg-white p-4 dark:border-[#3b4438] dark:bg-[#1a201a]">
      <p className="m-0 text-sm text-[#68746d] dark:text-[#a8b2a8]">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-snug text-[#435048] dark:text-[#c7d0c3]">
        {explanation}
      </p>
    </div>
  );
}
