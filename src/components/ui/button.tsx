import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-jakarta font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-premium",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-premium",
        outline: "border border-glass-border glass-card hover:bg-glass-hover hover:border-glass-border/70",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-float",
        ghost: "hover:bg-glass-hover hover:text-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "gradient-primary text-white hover:shadow-glow transition-all duration-300 hover:scale-105 font-semibold",
        glass: "glass-card glass-hover border-glass-border/50 text-foreground backdrop-blur-xl",
        hero: "gradient-primary text-white text-lg font-semibold px-8 py-4 rounded-2xl hover:shadow-glow hover:scale-105 transition-all duration-300",
        success: "bg-success text-white hover:bg-success/90 shadow-float",
        warning: "bg-warning text-white hover:bg-warning/90 shadow-float"
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-11 w-11 rounded-2xl",
        "icon-sm": "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
