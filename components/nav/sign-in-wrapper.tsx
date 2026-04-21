import { useMediaQuery } from "@/hooks/use-media-query"
import React from "react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
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

/* -----------------------------
   SignIn Wrapper
------------------------------ */
/* -------------------------
   Wallet Connect Content
-------------------------- */
function WalletConnectContent() {
  const { setVisible } = useWalletModal()
  return (
    <div className="flex flex-col items-center gap-4 p-4 pb-6">
      <p className="text-center text-sm text-foreground/70">
        Connect your Solana wallet to access this feature.
      </p>
      <Button
        className="w-full gap-2"
        onClick={() => setVisible(true)}
      >
        <Wallet className="size-4" />
        Connect Wallet
      </Button>
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
             <WalletConnectContent />
           </DialogContent>
        </Dialog>
      )}
      {!isAuth && !isDesktop && (
        <Drawer open={open} onOpenChange={setOpen}>
           <DrawerContent>
             <DrawerHeader>
               <DrawerTitle>Sign in required</DrawerTitle>
             </DrawerHeader>
             <WalletConnectContent />
           </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
export default SignInWrapper;