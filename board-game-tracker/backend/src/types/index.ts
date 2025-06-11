export interface BoardGame {
  id: string; // Kept from before
  name: string; // Kept from before
  description: string; // Kept from before
  version?: string; // Kept from before - could be year for non-BGG items

  // New fields for this step
  bggId?: number;
  status?: string; // e.g., "Owned", "Wishlist", "Played", "Unopened", "Shrink-wrapped"
  bggRating?: number; // BGG average rating
  bggComplexity?: number; // BGG weight/complexity
  yearPublished?: number; // From BGG, or manual entry
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number; // BGG playing time (usually average)
  thumbnailUrl?: string; // From BGG
  imageUrl?: string;    // From BGG

  // Fields for next step (play tracking), can be added now with optional
  playCount?: number;
  lastPlayedDate?: string; // ISO date string
}
