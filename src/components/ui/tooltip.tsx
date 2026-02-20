import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
}

const Tooltip = ({ children }: TooltipProps) => {
  const [open, setOpen] = React.useState(false)
  const handleMouseEnter = () => {
    setOpen(true)
  }

  const handleMouseLeave = () => {
    setOpen(false)
  }

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<{ open?: boolean }>(child)) {
            return React.cloneElement(child, { open })
          }
          return child
        })}
      </div>
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps {
  asChild?: boolean
  children: React.ReactElement
}

const TooltipTrigger = ({ children, asChild, ...props }: TooltipTriggerProps) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
    })
  }

  return <>{children}</>
}
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  open?: boolean
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", sideOffset = 4, open, children, ...props }, ref) => {
    const context = React.useContext(TooltipContext)
    const isOpen = open !== undefined ? open : context?.open ?? false

    if (!isOpen) return null

    const sideClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "z-50 absolute whitespace-nowrap overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
          sideClasses[side],
          className
        )}
        style={{ marginTop: side === "bottom" ? `${sideOffset}px` : undefined, marginBottom: side === "top" ? `${sideOffset}px` : undefined, marginLeft: side === "right" ? `${sideOffset}px` : undefined, marginRight: side === "left" ? `${sideOffset}px` : undefined }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
