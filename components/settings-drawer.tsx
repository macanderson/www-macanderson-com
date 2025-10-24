"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useMobile } from "@/hooks/use-mobile"

type SettingsDrawerProps = {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}

export function SettingsDrawer({ open, onOpenChangeAction }: SettingsDrawerProps) {
  const isMobile = useMobile()

  const content = (
    <div className="flex flex-1 items-center justify-center h-full min-h-[300px]">
      <span className="text-xl font-semibold text-muted-foreground text-center">
        Under Construction
      </span>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChangeAction}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
