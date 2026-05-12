"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Trash2, Loader2 } from "lucide-react";
import { deleteAccount, logout } from "@/app/login/actions";

function LogoutSubmitInner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm py-3 px-4 text-sm font-semibold text-gray-800 transition hover:bg-white active:scale-[0.99] disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          Logging out…
        </>
      ) : (
        <>
          <LogOut className="h-5 w-5" strokeWidth={2} />
          Log out
        </>
      )}
    </button>
  );
}

function DeleteSubmitInner() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 px-4 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
          Deleting account…
        </>
      ) : (
        <>
          <Trash2 className="h-5 w-5 shrink-0" />
          Delete Account
        </>
      )}
    </button>
  );
}

export function SettingsLogoutForm() {
  return (
    <form action={logout}>
      <LogoutSubmitInner />
    </form>
  );
}

export function SettingsDeleteAccountForm() {
  return (
    <form action={deleteAccount}>
      <DeleteSubmitInner />
    </form>
  );
}
