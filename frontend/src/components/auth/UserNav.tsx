'use client';

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User } from "lucide-react"
import { toast } from "sonner"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"

export function UserNav() {
  const { data: session } = useSession()
  const tNav = useTranslations("nav")
  const tAuth = useTranslations("auth")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const [showConfirm, setShowConfirm] = useState(false)

  if (!session?.user) return null

  const username =
    session.user.username || session.user.email || tCommon("userFallback")
  const initials = username.substring(0, 2).toUpperCase()

  const handleLogout = async () => {
    const prefix = locale === 'en' ? '' : `/${locale}`
    await signOut({ redirect: true, callbackUrl: `${prefix}/login` })
    toast.success(tAuth("logoutSuccess"))
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{username}</p>
              {session.user.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>{tNav("dashboard")}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowConfirm(true)} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{tNav("logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="logout-title" className="text-lg font-semibold">
              {tAuth("logoutConfirmTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tAuth("logoutConfirmMessage")}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                {tAuth("logoutConfirmCancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowConfirm(false)
                  handleLogout()
                }}
              >
                {tAuth("logoutConfirmAction")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
