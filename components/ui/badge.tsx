import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        // Neutro (New): chip cinza.
        neutral:
          "border-border bg-muted text-secondary-foreground",
        // In Progress / Duplicate: amarelo.
        primary:
          "border-transparent bg-primary/15 text-primary",
        // Resolved / sucesso: verde.
        success:
          "border-transparent bg-success/15 text-success",
        // Overdue / erro: vermelho.
        danger:
          "border-transparent bg-danger/15 text-danger",
        // Waiting / Missing info: âmbar.
        warning:
          "border-transparent bg-warning/15 text-warning",
        // Need Information: azul.
        info:
          "border-transparent bg-info/20 text-info",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
