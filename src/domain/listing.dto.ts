/** JSON shape aligned with kytalist `Listing` (frontend). */
export type ListingCategoryDto = "activity" | "camp" | "internship";

export type ExtracurricularTypeDto =
  | "Competition"
  | "Research"
  | "Program"
  | "Club"
  | "Volunteer"
  | "Leadership"
  | "Arts"
  | "STEM";

export type CostOptionDto = "Free" | "Paid" | "Stipend";

export type ListingJson = {
  id: string;
  title: string;
  org: string;
  location: string;
  region: string;
  description: string;
  image: string;
  category: ListingCategoryDto;
  badge: string;
  footer: string;
  deadline?: string;
  type?: ExtracurricularTypeDto;
  cost?: CostOptionDto;
  grades?: number[];
  tags?: string[];
};

/** Admin-only listing shape (workflow + scheduling). Public routes use `ListingJson`. */
export type ListingStatusDto = "draft" | "published" | "archived";

export type AdminListingJson = ListingJson & {
  status: ListingStatusDto;
  deadlineAt: string | null;
  featuredOrder: number | null;
  trendingOrder: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
};

export type ListingsSort = "deadline" | "alpha" | "recent";

export type ListListingsQuery = {
  category: ListingCategoryDto | "all";
  region: string | undefined;
  type: ExtracurricularTypeDto | undefined;
  cost: CostOptionDto | undefined;
  grade: number | undefined;
  q: string | undefined;
  sort: ListingsSort;
  limit: number;
  offset: number;
};
