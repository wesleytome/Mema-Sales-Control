import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[var(--button-primary-bg)] text-[var(--button-primary-fg)] border border-transparent shadow-[0_2px_6px_rgba(0,0,0,0.12)] hover:brightness-110",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 shadow-[0_2px_6px_rgba(0,0,0,0.12)]",
        outline:
          "border border-border/80 bg-[var(--button-secondary-bg)] text-[var(--button-secondary-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-muted",
        secondary:
          "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-fg)] border border-border/70 hover:bg-muted shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        ghost:
          "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
