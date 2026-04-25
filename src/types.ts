export type CreativeRole = "Photographer" | "Model" | "Makeup Artist" | "Other";

export type ExperienceLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Professional"
  | "Industry Veteran";

export type ContentRating = "Safe" | "Suggestive" | "Explicit";

export type HonestyLevel = "Be Gentle" | "Be Honest" | "Cook Me Respectfully";

export interface UserProfile {
  id: string;
  displayName: string;
  username: string; // Instagram handle
  role: CreativeRole;
  creativeTitle?: string;
  city: string;
  experienceLevel: ExperienceLevel;
  bio?: string;
  isSupporter: boolean;
  avatarUrl?: string;
  website?: string;
}

export interface ReviewRequest {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorUsername?: string;
  creatorRole?: string;
  imageUrl: string;
  caption: string;
  contentRating: ContentRating;
  feedbackCategories: string[];
  honestyLevel: HonestyLevel;
  allowAnonymous: boolean;
  createdAt: string;
  reviewCount: number;
}

export interface Critique {
  id: string;
  requestId: string;
  reviewerId: string;
  isAnonymous: boolean;
  whatWorks: string;
  whatNeedsWork: string;
  quickFix: string;
  portfolioReady: "Yes" | "No" | "Almost";
  rating?: number;
  createdAt: string;
}

export interface Vent {
  id: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  upvotes: number;
}
