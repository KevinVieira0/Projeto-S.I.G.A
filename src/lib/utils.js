import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais (clsx) e resolve conflitos de classes
 * Tailwind (twMerge). Ex: cn("px-2", condicao && "px-4") -> "px-4".
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
