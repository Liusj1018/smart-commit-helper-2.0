import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind 类名的工具函数（shadcn/ui 通用工具）。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}