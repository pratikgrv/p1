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
  LogIn,
  LogOut,
  Loader2,
  User,
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
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAuth } from "@/contexts/auth-context"
import { ChatSidebar } from "@/components/chat-sidebar"
import { useParams } from "next/navigation"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import SignInWrapper from "./sign-in-wrapper"

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
    "hidden lg:flex flex-col items-center w-16 h-screen py-2 bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0 z-50",
  iconBtn: "w-10 h-10 flex items-center justify-center rounded-lg transition",
  active: "bg-sidebar-accent text-sidebar-accent-foreground",
  inactive:
    "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
}

/* ------------------------------ Nav Item --------------------------------- */
function NavItem({
  item,
  isActive,
  onMouseEnter,
  onMouseLeave,
}: {
  item: NavigationItem
  isActive: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link href={item.href} onClick={handleClick}>
        <Icon className="size-5" />
      </Link>
    </Button>
  )
}

/* ------------------------------ Auth Badge ------------------------------- */
function AuthBadge() {
  const { isAuth, user, walletStatus, isLoading } = useAuth()
  const router = useRouter()

  if (walletStatus === "signing" || isLoading) {
    return (
      <div className={cn(styles.iconBtn, styles.inactive)}>
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <SignInWrapper isAuth={isAuth} requiresAuth wrapperClassName="contents">
      <Button
        variant="ghost"
        size="icon"
        className={cn(styles.iconBtn, styles.inactive)}
        title="Profile"
        onClick={() => {
          if (isAuth) router.push("/profile")
        }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
      </Button>
    </SignInWrapper>
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

/* ------------------------------ Mobile Drawer ------------------------------ */
function MobileProfileDrawer() {
  const { isAuth, user } = useAuth()
  const router = useRouter()
  return (
    <SignInWrapper
      isAuth={isAuth}
      requiresAuth
      wrapperClassName="flex flex-1 flex-col items-center text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
    >
      <button
        onClick={() => {
          if (isAuth) router.push("/profile")
        }}
        className="flex flex-1 flex-col items-center"
      >
        <User className="size-5" />
        <span className="mt-1">Profile</span>
      </button>
    </SignInWrapper>
  )
}

/* ------------------------------ Main Wrapper ----------------------------- */
export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuth } = useAuth()
  const [historyHover, setHistoryHover] = React.useState(false)
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

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

  const handleMouseEnterHistory = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHistoryHover(true)
  }

  const handleMouseLeaveHistory = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHistoryHover(false)
    }, 300)
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* ──────────── Sidebar (Desktop) ──────────── */}
      <aside className={styles.sidebar}>
        <Link href="/" className="mb-6 flex items-center justify-center pt-2">
          <div className="flex h-8 w-8 items-center justify-center rounded border bg-primary text-xs font-bold text-primary-foreground shadow">
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
          {isAuth && (
            <NavItem
              item={{
                id: "history",
                label: "History",
                href: "/history",
                icon: History,
              }}
              isActive={isActive("/history")}
              onMouseEnter={handleMouseEnterHistory}
              onMouseLeave={handleMouseLeaveHistory}
            />
          )}
          <AuthBadge />
        </div>
      </aside>

      {/* ──────────── Secondary Sidebar (Hover) ──────────── */}
      {isAuth && (
        <div
          className={cn(
            "absolute top-0 left-16 z-40 hidden h-full w-80 border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 ease-in-out lg:flex",
            historyHover ? "translate-x-0" : "-translate-x-full"
          )}
          onMouseEnter={handleMouseEnterHistory}
          onMouseLeave={handleMouseLeaveHistory}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-sidebar-border p-4">
              <h2 className="text-lg font-semibold">History</h2>
              <Link
                href="/history"
                className="text-xs text-primary hover:underline"
                onClick={() => setHistoryHover(false)}
              >
                View all
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ChatSidebar onNavigate={() => setHistoryHover(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ──────────── Main Content ──────────── */}
      <main className="flex flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
        {children}
      </main>

      {/* ──────────── Bottom Nav (Mobile) ──────────── */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 border-t border-sidebar-border bg-sidebar lg:hidden">
        <div className="flex justify-around py-2">
          {primaryNav
            .filter((i) => i.id !== "chat")
            .map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center text-xs transition-colors",
                    active
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="mt-1">{item.label}</span>
                </Link>
              )
            })}

          {/* Mobile History */}
          {isAuth && (
            <Link
              href="/history"
              className={cn(
                "flex flex-1 flex-col items-center text-xs transition-colors",
                isActive("/history")
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
              )}
            >
              <History className="size-5" />
              <span className="mt-1">History</span>
            </Link>
          )}

          {/* Mobile Profile Icon with Drawer */}
          <MobileProfileDrawer />
        </div>
      </nav>
    </div>
  )
}
