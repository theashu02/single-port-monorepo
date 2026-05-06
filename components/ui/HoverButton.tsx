import { Button } from "@/components/ui/button";
import * as React from "react";

type HoverButtonProps = React.ComponentProps<typeof Button>;

const HoverButton = ({ children, className = "", ...props }: HoverButtonProps) => {
  return (
    <Button
      className={`
        group relative overflow-hidden rounded-full border border-border bg-primary 
        px-6 py-2 text-sm font-medium text-primary-foreground transition-all duration-300 
        hover:border-ring 
        ${className}
      `}
      {...props}
    >
      <span className="absolute inset-0 z-0 origin-left scale-x-0 bg-primary-foreground transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-x-100" />
      <span className="relative z-10 flex items-center gap-2 transition-colors duration-500 group-hover:text-primary">{children}</span>
    </Button>
  );
};

export default HoverButton;
