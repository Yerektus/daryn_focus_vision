import { logout } from "@/app/auth-actions";

export default function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[9rem] truncate text-sm font-extrabold text-ink sm:max-w-[14rem]" title={email}>
        {name}
      </span>
      <form action={logout}>
        <button
          type="submit"
          className="pill-kid px-4 py-2.5 text-sm font-extrabold"
        >
          Выйти
        </button>
      </form>
    </div>
  );
}
