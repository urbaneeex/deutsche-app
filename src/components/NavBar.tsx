"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  IconCards,
  IconChart,
  IconChat,
  IconCompass,
  IconMic,
} from "@/components/icons";

const links = [
  { href: "/learn", label: "Aprender", Icon: IconCompass },
  { href: "/flashcards", label: "Tarjetas", Icon: IconCards },
  { href: "/review", label: "Revisión", Icon: IconChart },
  { href: "/situations", label: "Situaciones", Icon: IconChat },
  { href: "/pronunciation", label: "Voz", Icon: IconMic },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, configured, signOut } = useAuth();

  if (pathname === "/login") return null;

  return (
    <>
      <header className="hidden border-b border-stone-800 bg-stone-950/80 backdrop-blur sm:block">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/learn" className="text-lg font-bold tracking-tight">
            Deutsch<span className="text-amber-400">lernen</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-amber-500/15 text-amber-300"
                    : "text-stone-300 hover:bg-stone-800"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            {configured && user && (
              <button
                onClick={() => signOut()}
                className="ml-2 rounded-lg px-3 py-2 text-sm text-stone-400 hover:bg-stone-800 hover:text-stone-200"
              >
                Salir
              </button>
            )}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-between border-t border-stone-800 bg-stone-950/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
              pathname.startsWith(href)
                ? "text-amber-300"
                : "text-stone-400"
            }`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
