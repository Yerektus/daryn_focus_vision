import Mascot from "@/components/Mascot";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center">
        <Mascot className="relative z-10 -mb-6 h-32 w-24" />
        <div className="card-kid w-full p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
