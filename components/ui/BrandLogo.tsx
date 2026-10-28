import Image from "next/image";
import logo from "@/public/brand/parivaarcall-logo.png";
import icon from "@/public/brand/parivaarcall-icon.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  iconOnly = false,
  priority = false
}: {
  className?: string;
  iconOnly?: boolean;
  priority?: boolean;
}) {
  return (
    <Image
      src={iconOnly ? icon : logo}
      alt="ParivaarCall"
      className={cn("block h-auto shrink-0", iconOnly ? "w-12" : "w-52 sm:w-64", className)}
      sizes={iconOnly ? "48px" : "(max-width: 640px) 208px, 256px"}
      priority={priority}
    />
  );
}
