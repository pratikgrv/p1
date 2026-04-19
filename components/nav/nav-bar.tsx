"use client"

import React from "react"
import { Button } from "../ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Globe,
  Plus,
  History,
  Settings,
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
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import SignInWrapper from "./sign-in-wrapper"

/* -----------------------------
   Types
------------------------------ */
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ElementType
  fn?: () => void
  requiresAuth?: boolean
}

/* -----------------------------
   Sidebar Styles
------------------------------ */
const styles = {
  sidebar:
    "hidden lg:flex flex-col items-center w-16 h-screen py-2 bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0",
  iconBtn: "w-10 h-10 flex items-center justify-center rounded-lg transition",
  active: "bg-sidebar-accent text-sidebar-accent-foreground",
  inactive:
    "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
}



/* -----------------------------
   Nav Item (shared)
------------------------------ */
const NavItem = ({ item, isActive }: { item: NavigationItem, isActive: boolean }) => {

  const Icon = item.icon

  const handleClick = (e: React.MouseEvent) => {
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

/* -----------------------------
   Main Wrapper
------------------------------ */
export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  //const { session } = useAuth()
  const isAuth = false

  const [dialog, setDialog] = React.useState<string | null>(null)

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/" && pathname?.startsWith(href))

  /* -----------------------------
	   Navigation config
	------------------------------ */
  const primaryNav: NavigationItem[] = [
    { id: "home", label: "Home", href: "/", icon: Sparkles },
    { id: "explore", label: "Explore", href: "/explore", icon: Globe },
    {
      id: "chat",
      label: "New Chat",
      href: "#",
      icon: Plus,
      fn: () => {
        // clear message and start new chat
      },
    },
  ]

  const secondaryNav: NavigationItem[] = [
    {
      id: "history",
      label: "History",
      href: "#",
      icon: History,
      fn: () => setDialog("history"),
      requiresAuth: true,
    },
    {
      id: "profile",
      label: "Profile",
      href: "#",
      icon: User,
      fn: () => setDialog("profile"),
      requiresAuth: true,
    },
  ]

  return (
    <div className="relative flex h-screen bg-background">
      {/* ---------------- Sidebar (Desktop) ---------------- */}
      <aside className={styles.sidebar}>
        <Link href="/" className="mb-6 flex items-center justify-center pt-2">
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow border">
            UM
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-3">
          {primaryNav.map((item) => (
            <SignInWrapper key={item.id} isAuth={isAuth} requiresAuth={item.requiresAuth}>
              <NavItem
                item={item}
                isActive={isActive(item.href)}
              />
            </SignInWrapper>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          {secondaryNav.map((item) => (
            <SignInWrapper key={item.id} isAuth={isAuth} requiresAuth={item.requiresAuth}>
              <NavItem
                item={item}
                isActive={isActive(item.href)}
              />
            </SignInWrapper>
          ))}
        </div>
      </aside>

      {/* ---------------- Main Content ---------------- */}
      <main className="flex-1 overflow-y-auto p-6 pb-24 lg:pb-6">
        {children}
      </main>

    

      {/* ---------------- Bottom Nav (Mobile) ---------------- */}
      <nav className="fixed right-0 bottom-0 left-0 border-t border-sidebar-border bg-sidebar lg:hidden">
        <div className="flex justify-around py-2">
          {[...primaryNav.filter(i => i.id !== 'chat'), ...secondaryNav].map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            const handleMobileClick = (e: React.MouseEvent) => {
              if (item.fn) {
                e.preventDefault()
                item.fn()
              }
            }

            return (
              <SignInWrapper key={item.id} isAuth={isAuth} requiresAuth={item.requiresAuth} wrapperClassName="flex flex-1 contents">
                <Link
                  href={item.href}
                  onClick={handleMobileClick}
                  className={cn(
                    "flex flex-col items-center text-xs transition-colors flex-1",
                    active
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="mt-1">{item.label}</span>
                </Link>
              </SignInWrapper>
            )
          })}
        </div>
      </nav>

      {/* ---------------- Dialog ---------------- */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "history" && "History"}
              {dialog === "profile" && "Profile"}
            </DialogTitle>
          </DialogHeader>

          {dialog === "history" && <div>History content</div>}
          {dialog === "profile" && <div>Profile content</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
