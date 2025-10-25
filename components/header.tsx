"use client"

import { Moon, Sun, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { useState } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const isMobile = useMobile()

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">

            <div className="hidden md:block">
              <h1 className="text-lg font-light text-muted-foreground hover:text-primary transition-colors duration-300 text-balance">macanderson.com</h1>

            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col gap-4 mt-8">
                    <Button variant="outline" onClick={toggleTheme} className="justify-start w-full bg-transparent">
                      {theme === "dark" ? (
                        <>
                          <Sun className="w-4 h-4 mr-2" />
                          Light Mode
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 mr-2" />
                          Dark Mode
                        </>
                      )}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

    </>
  )
}
