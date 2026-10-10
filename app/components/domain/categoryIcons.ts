import {
  BookOpen,
  Car,
  Cpu,
  Dumbbell,
  Factory,
  House,
  Landmark,
  Package,
  Palette,
  Puzzle,
  Shirt,
  Sofa,
  Watch,
  type LucideIcon,
} from "lucide-react";
import type { AuctionCategory } from "@/lib/types";

export const CATEGORY_ICONS: Record<AuctionCategory, LucideIcon> = {
  ELECTRONICS: Cpu,
  VEHICLES: Car,
  REAL_ESTATE: House,
  ART_AND_COLLECTIBLES: Palette,
  JEWELLERY_AND_WATCHES: Watch,
  FASHION_AND_ACCESSORIES: Shirt,
  FURNITURE_AND_HOME: Sofa,
  SPORTS_AND_OUTDOORS: Dumbbell,
  BOOKS_AND_MEDIA: BookOpen,
  TOYS_AND_GAMES: Puzzle,
  INDUSTRIAL_AND_MACHINERY: Factory,
  ANTIQUES: Landmark,
  OTHER: Package,
};
