import { useMediaQuery } from "@/hooks/use-media-query"
import React from "react"
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
             <div className="p-4 text-center text-sm text-foreground/70">Please sign in to access this feature.</div>
           </DialogContent>
        </Dialog>
      )}
      {!isAuth && !isDesktop && (
        <Drawer open={open} onOpenChange={setOpen}>
           <DrawerContent>
             <DrawerHeader>
               <DrawerTitle>Sign in required</DrawerTitle>
             </DrawerHeader>
             <div className="p-4 text-center text-sm text-foreground/70 pb-8">Please sign in to access this feature.</div>
           </DrawerContent>
        </Drawer>
      )}
    </>
  )
}
export default SignInWrapper;