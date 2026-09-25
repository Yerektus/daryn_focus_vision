import { logout } from "@/app/auth-actions";

export default function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[9rem] truncate text-sm font-bold text-neutral-700 sm:max-w-[14rem]" title={email}>
        {name}
      </span>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-full bg-[#F1EEEA] px-4 py-2.5 text-sm font-bold text-neutral-500 transition hover:bg-[#E9E5E0] hover:text-neutral-900"
        >
          Выйти
        </button>
      </form>
    </div>
  );
}
