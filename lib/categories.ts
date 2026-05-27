import {
  Utensils, Car, ShoppingBag, Heart, Gamepad2, Package, Tag, Folder, Sparkles, Book, Home, Zap,
  Coffee, Plane, Smartphone, Gift, Wrench, Scissors, CreditCard, GraduationCap, Droplet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const PREDEFINED_CATEGORIES = [
  { name: "FOOD", label: "Makanan", icon: "Utensils", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { name: "TRANSPORT", label: "Transport", icon: "Car", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { name: "LIFESTYLE", label: "Lifestyle", icon: "ShoppingBag", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { name: "HEALTH", label: "Kesehatan", icon: "Heart", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { name: "ENTERTAINMENT", label: "Hiburan", icon: "Gamepad2", color: "bg-pink-50 text-pink-600 border-pink-200" },
  { name: "OTHERS", label: "Lainnya", icon: "Package", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

export const AVAILABLE_ICONS: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  Heart,
  Gamepad2,
  Package,
  Tag,
  Folder,
  Sparkles,
  Book,
  Home,
  Zap,
  Coffee,
  Plane,
  Smartphone,
  Gift,
  Wrench,
  Scissors,
  CreditCard,
  GraduationCap,
  Droplet,
  skincare: Droplet,
};

export const AVAILABLE_COLORS = [
  "bg-red-50 text-red-600 border-red-200",
  "bg-orange-50 text-orange-600 border-orange-200",
  "bg-amber-50 text-amber-600 border-amber-200",
  "bg-yellow-50 text-yellow-600 border-yellow-200",
  "bg-lime-50 text-lime-600 border-lime-200",
  "bg-green-50 text-green-600 border-green-200",
  "bg-emerald-50 text-emerald-600 border-emerald-200",
  "bg-teal-50 text-teal-600 border-teal-200",
  "bg-cyan-50 text-cyan-600 border-cyan-200",
  "bg-sky-50 text-sky-600 border-sky-200",
  "bg-blue-50 text-blue-600 border-blue-200",
  "bg-indigo-50 text-indigo-600 border-indigo-200",
  "bg-violet-50 text-violet-600 border-violet-200",
  "bg-purple-50 text-purple-600 border-purple-200",
  "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
  "bg-pink-50 text-pink-600 border-pink-200",
  "bg-rose-50 text-rose-600 border-rose-200",
];

export function getCategoryStyle(categoryName: string, customCategories?: Array<{ name: string, color: string | null, icon: string | null }>) {
  // Check predefined first
  const predefined = PREDEFINED_CATEGORIES.find(c => c.name === categoryName);
  if (predefined) {
    return {
      label: predefined.label,
      color: predefined.color,
      Icon: AVAILABLE_ICONS[predefined.icon] || Tag
    };
  }

  // Check custom
  const custom = customCategories?.find(c => c.name === categoryName);
  if (custom) {
    return {
      label: custom.name,
      color: custom.color || "bg-slate-100 text-slate-600 border-slate-200",
      Icon: (custom.icon && AVAILABLE_ICONS[custom.icon]) ? AVAILABLE_ICONS[custom.icon] : Tag
    };
  }

  // Fallback
  return {
    label: categoryName,
    color: "bg-slate-100 text-slate-600 border-slate-200",
    Icon: Tag
  };
}
