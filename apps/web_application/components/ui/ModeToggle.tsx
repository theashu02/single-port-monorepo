"use client"

import * as React from "react"
import { Moon, Sun, MonitorSmartphone, MoonStar, Ghost } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle({ isCollapsed }: { isCollapsed?: boolean }) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isCollapsed !== undefined ? (
          <Button
            variant="ghost"
            className={cn(
              "flex h-11 w-full items-center justify-start rounded-xl border-0 bg-white/5 px-3 text-white/70 hover:bg-white/10 hover:text-white",
              isCollapsed && "justify-center px-0",
            )}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            </span>

            {!isCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 overflow-hidden whitespace-nowrap text-sm font-medium">
                Theme
              </motion.span>
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px] rounded-2xl p-1.5">
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className="cursor-pointer gap-2 rounded-md py-2"
        >
          <Sun className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className="cursor-pointer gap-2 rounded-md py-2"
        >
          <Moon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark-pro")} 
          className="cursor-pointer gap-2 rounded-md py-2"
        >
          <MoonStar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Dark Pro</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("snapchat")} 
          className="cursor-pointer gap-2 rounded-md py-2"
        >
          <Ghost className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Snapchat</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className="cursor-pointer gap-2 rounded-md py-2"
        >
          <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}