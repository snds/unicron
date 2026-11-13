// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { Icon } from "../icon"
import { Spinner } from "./spinner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <Icon className="size-4" name="checkmark--outline" />
        ),
        info: (
          <Icon className="size-4" name="information" />
        ),
        warning: (
          <Icon className="size-4" name="warning--alt" />
        ),
        error: (
          <Icon className="size-4" name="misuse--outline" />
        ),
        loading: (
          <Spinner className="size-4" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "rounded-2xl",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
