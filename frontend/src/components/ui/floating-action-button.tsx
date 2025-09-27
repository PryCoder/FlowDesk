import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fabVariants = cva(
  "fixed inline-flex items-center justify-center rounded-full shadow-premium backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 z-50",
  {
    variants: {
      variant: {
        default: "gradient-primary text-white shadow-glow",
        secondary: "bg-glass border border-glass-border/50 text-foreground hover:bg-glass-hover",
        premium: "gradient-primary text-white shadow-glow animate-glow",
      },
      size: {
        default: "h-14 w-14",
        sm: "h-12 w-12",
        lg: "h-16 w-16",
      },
      position: {
        "bottom-right": "bottom-8 right-8",
        "bottom-left": "bottom-8 left-8",
        "top-right": "top-8 right-8",
        "top-left": "top-8 left-8",
        "bottom-center": "bottom-8 left-1/2 transform -translate-x-1/2",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "bottom-right",
    },
  }
);

export interface FloatingActionButtonProps
  extends Omit<HTMLMotionProps<"button">, "size">,
    VariantProps<typeof fabVariants> {
  children: React.ReactNode;
}

const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(({ className, variant, size, position, children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      className={cn(fabVariants({ variant, size, position, className }))}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0, y: 100 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        opacity: { duration: 0.2 },
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
});

FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton, fabVariants };