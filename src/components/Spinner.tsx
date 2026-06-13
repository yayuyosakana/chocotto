export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-[#a98f7d]">
      <div className="spin h-8 w-8 rounded-full border-4 border-[#f7c9b6] border-t-[#6f4e37]" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
