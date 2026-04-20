"use client"

import React from "react"
import { Button } from "../ui/button"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Globe,
  Plus,
  History,
  Settings,
  User,
  LogIn,
  LogOut,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/contexts/auth-context"
import { ChatSidebar } from "@/components/chat-sidebar"
import { useParams } from "next/navigation"

/* -------------------------------- Types ---------------------------------- */
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ElementType
  fn?: () => void
  requiresAuth?: boolean
}

/* ------------------------------ Sidebar Styles --------------------------- */
const styles = {
  sidebar:
    "hidden lg:flex flex-col items-center w-16 h-screen py-2 bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0",
  iconBtn: "w-10 h-10 flex items-center justify-center rounded-lg transition",
  active: "bg-sidebar-accent text-sidebar-accent-foreground",
  inactive:
    "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
}

/* ------------------------------ Nav Item --------------------------------- */
function NavItem({ item, isActive }: { item: NavigationItem; isActive: boolean }) {
  const Icon = item.icon

  function handleClick(e: React.MouseEvent) {
    if (item.fn) {
      e.preventDefault()
      item.fn()
    }
  }

  return (
    <Button
      asChild
      size="icon"
      variant="ghost"
      className={cn(styles.iconBtn, isActive ? styles.active : styles.inactive)}
    >
      <Link href={item.href} onClick={handleClick}>
        <Icon className="size-5" />
      </Link>
    </Button>
  )
}

/* ------------------------------ Auth Badge ------------------------------- */
function AuthBadge() {
  const { isAuth, user, signIn, signOut } = useAuth()

  if (isAuth) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* Avatar circle */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className={cn(styles.iconBtn, styles.inactive, "w-8 h-8")}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={signIn}
      title="Sign in (demo)"
      className={cn(styles.iconBtn, styles.inactive)}
    >
      <LogIn className="size-5" />
    </button>
  )
}

/* ------------------------------ History Panel ---------------------------- */
function HistoryPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const isMobile = useMediaQuery("(max-width: 1024px)")
  const { isAuth, user } = useAuth()
  const params = useParams()
  const currentChatId = params?.id as string | undefined

  const title = isAuth ? `${user?.name}'s Chats` : "Chat History"

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <ChatSidebar currentChatId={currentChatId} onNavigate={onClose} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ChatSidebar currentChatId={currentChatId} onNavigate={onClose} />
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------ Mobile Auth ------------------------------ */
function MobileAuthButton() {
  const { isAuth, signIn, signOut } = useAuth()
  if (isAuth) {
    return (
      <button
        onClick={signOut}
        className="flex flex-1 flex-col items-center text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
      >
        <LogOut className="size-5" />
        <span className="mt-1">Sign out</span>
      </button>
    )
  }
  return (
    <button
      onClick={signIn}
      className="flex flex-1 flex-col items-center text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
    >
      <LogIn className="size-5" />
      <span className="mt-1">Sign in</span>
    </button>
  )
}

/* ------------------------------ Main Wrapper ----------------------------- */
export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuth } = useAuth()
  const [historyOpen, setHistoryOpen] = React.useState(false)

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname?.startsWith(href))
  }

  const primaryNav: NavigationItem[] = [
    { id: "home", label: "Home", href: "/", icon: Sparkles },
    { id: "explore", label: "Explore", href: "/explore", icon: Globe },
    {
      id: "chat",
      label: "New Chat",
      href: "#",
      icon: Plus,
      fn: () => router.push("/"),
    },
  ]

  const secondaryNav: NavigationItem[] = [
    {
      id: "history",
      label: "History",
      href: "#",
      icon: History,
      fn: () => setHistoryOpen(true),
    },
  ]

  return (
    <div className="relative flex h-screen bg-background">
      {/* ──────────── Sidebar (Desktop) ──────────── */}
      <aside className={styles.sidebar}>
        <Link href="/" className="mb-6 flex items-center justify-center pt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground shadow border">
            UM
          </div>
        </Link>

        {/* Primary nav */}
        <div className="flex flex-1 flex-col gap-3">
          {primaryNav.map((item) => (
            <NavItem key={item.id} item={item} isActive={isActive(item.href)} />
          ))}
        </div>

        {/* Bottom: history + auth */}
        <div className="mt-auto flex flex-col items-center gap-3">
          {secondaryNav.map((item) => (
            <NavItem key={item.id} item={item} isActive={false} />
          ))}
          <AuthBadge />
        </div>
      </aside>

      {/* ──────────── Main Content ──────────── */}
      <main className="flex flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
        {children}
      </main>

      {/* ──────────── Bottom Nav (Mobile) ──────────── */}
      <nav className="fixed right-0 bottom-0 left-0 border-t border-sidebar-border bg-sidebar lg:hidden">
        <div className="flex justify-around py-2">
          {[...primaryNav.filter((i) => i.id !== "chat"), ...secondaryNav].map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            function handleMobileClick(e: React.MouseEvent) {
              if (item.fn) {
                e.preventDefault()
                item.fn()
              }
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleMobileClick}
                className={cn(
                  "flex flex-1 flex-col items-center text-xs transition-colors",
                  active
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-5" />
                <span className="mt-1">{item.label}</span>
              </Link>
            )
          })}

          {/* Mobile sign in/out */}
          <MobileAuthButton />
        </div>
      </nav>

      {/* ──────────── History Panel ──────────── */}
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  )
}
