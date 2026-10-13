"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Menu, PlusCircle, ShieldCheck, User, X } from "lucide-react";
import { Logo } from "./logo";
import { LinkButton, Button } from "@/components/ui/button";
import { Avatar, Container } from "@/components/ui/misc";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/problems", label: "Discover" },
  { href: "/graph", label: "Problem Graph" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/contribute", label: "Contribute" },
];

function UserMenu() {
  const { view, hydrated, signOut } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = view.currentUser;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!hydrated) return <div className="h-8 w-20" aria-hidden />;
  if (!user)
    return (
      <Link href="/signin" className="rounded-md px-3 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg">
        Sign In
      </Link>
    );

  const item = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg-muted hover:bg-surface-3 hover:text-fg";
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-surface-2"
      >
        <Avatar name={user.name} size={28} />
        <span className="hidden text-sm text-fg-muted lg:inline">{user.name.split(" ")[0]}</span>
        <span className="sr-only">Open account menu</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 rounded-lg border border-line-strong bg-surface-2 p-1.5 shadow-2xl shadow-black/50">
          <div className="border-b border-line px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium text-fg">{user.name}</p>
            <p className="text-xs text-fg-subtle">
              @{user.handle} · {user.role}
              {user.isDemo && " · demo profile"}
            </p>
          </div>
          <div className="pt-1.5">
            <Link role="menuitem" href="/dashboard" className={item} onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" aria-hidden /> Dashboard
            </Link>
            <Link role="menuitem" href={`/profile/${user.handle}`} className={item} onClick={() => setOpen(false)}>
              <User className="size-4" aria-hidden /> Profile
            </Link>
            <Link role="menuitem" href="/submit" className={item} onClick={() => setOpen(false)}>
              <PlusCircle className="size-4" aria-hidden /> Submit a problem
            </Link>
            <Link role="menuitem" href="/review" className={item} onClick={() => setOpen(false)}>
              <ShieldCheck className="size-4" aria-hidden /> Review queue
            </Link>
            <button
              role="menuitem"
              className={item}
              onClick={() => {
                setOpen(false);
                signOut();
              }}
            >
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { view, hydrated } = useStore();

  useEffect(() => {
    // Close the mobile menu after navigation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <Container className="flex h-14 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(n.href) ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {hydrated && view.currentUser && (
            <Link href="/dashboard" className={cn("rounded-md px-3 py-1.5 text-sm transition-colors", pathname === "/dashboard" ? "text-fg" : "text-fg-muted hover:text-fg")}>
              Dashboard
            </Link>
          )}
          <UserMenu />
          <LinkButton href="/problems" size="sm">
            Explore Problems
          </LinkButton>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
        </Button>
      </Container>
      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-bg md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-md px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">
                {n.label}
              </Link>
            ))}
            {view.currentUser ? (
              <>
                <Link href="/dashboard" className="rounded-md px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">Dashboard</Link>
                <Link href={`/profile/${view.currentUser.handle}`} className="rounded-md px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">Profile</Link>
                <Link href="/review" className="rounded-md px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">Review queue</Link>
              </>
            ) : (
              <Link href="/signin" className="rounded-md px-3 py-2.5 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg">Sign In</Link>
            )}
            <LinkButton href="/problems" className="mt-2">Explore Problems</LinkButton>
          </Container>
        </nav>
      )}
    </header>
  );
}
