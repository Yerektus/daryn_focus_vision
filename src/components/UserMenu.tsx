import { logout } from "@/app/auth-actions";
import ProfileLink from "./ProfileLink";

export default function UserMenu({
  name,
  stacked = false,
}: {
  name: string;
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <ProfileLink name={name} stacked={stacked} />
      <form action={logout}>
        <button
          type="submit"
          className={`pill-kid font-extrabold ${
            stacked ? "w-full px-5 py-3 text-left text-base" : "px-4 py-2.5 text-sm"
          }`}
        >
          Выйти
        </button>
      </form>
    </div>
  );
}
