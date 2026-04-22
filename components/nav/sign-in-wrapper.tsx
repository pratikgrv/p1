import { useMediaQuery } from "@/hooks/use-media-query"
import React from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

/* -------------------------
   Wallet Connect Content
-------------------------- */
function WalletConnectContent({ onConnect }: { onConnect?: () => void }) {
  const { wallets, select } = useWallet()
  const { setVisible } = useWalletModal()

  const detected = wallets.filter(
    (w) => w.readyState === "Installed" || w.readyState === "Loadable"
  )

  async function handleSelect(walletName: string) {
    select(walletName as Parameters<typeof select>[0])
    onConnect?.()
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-6">
      <p className="mb-2 text-center text-sm text-foreground/70">
        Connect your Solana wallet to continue.
      </p>

      {detected.length > 0 ? (
        <>
          {detected.map((w) => (
            <Button
              key={w.adapter.name}
              variant="outline"
              className="w-full justify-start gap-3 h-11"
              onClick={() => handleSelect(w.adapter.name)}
            >
              {w.adapter.icon ? (
                <Image
                  src={w.adapter.icon}
                  alt={w.adapter.name}
                  width={20}
                  height={20}
                  className="rounded-sm"
                  unoptimized
                />
              ) : (
                <Wallet className="size-5" />
              )}
              <span className="font-medium">{w.adapter.name}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full text-xs text-foreground/50"
            onClick={() => setVisible(true)}
          >
            More options…
          </Button>
        </>
      ) : (
        <>
          <p className="text-center text-xs text-foreground/50">
            No wallet extension detected.
          </p>
          {/* <Button className="w-full gap-2" onClick={() => setVisible(true)}>
            <Wallet className="size-4" />
            Connect Wallet
          </Button> */}
        </>
      )}
    </div>
  )
}

const SignInWrapper = ({ children, isAuth, requiresAuth, wrapperClassName = "contents" }: { children: React.ReactNode, isAuth: boolean, requiresAuth?: boolean, wrapperClassName?: string }) => {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (!requiresAuth) {
    return <>{children}</>
  }

  return (
    <>
      <div onClickCapture={(e) => {
        if (!isAuth) {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }
      }} className={wrapperClassName}>
        {children}
      </div>
      
      {!isAuth && isDesktop && (
        <Dialog open={open} onOpenChange={setOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Sign in required</DialogTitle>
             </DialogHeader>
             <WalletConnectContent onConnect={() => setOpen(false)} />
           </DialogContent>
        </Dialog>
      )}
      {!isAuth && !isDesktop && (
        <Drawer open={open} onOpenChange={setOpen}>
           <DrawerContent>
             <DrawerHeader>
               <DrawerTitle>Sign in required</DrawerTitle>
             </DrawerHeader>
             <WalletConnectContent onConnect={() => setOpen(false)} />
           </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
export default SignInWrapper;