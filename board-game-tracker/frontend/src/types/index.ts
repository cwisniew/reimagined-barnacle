export interface BoardGame {
  id: string;
  name: string;
  description: string;
  version?: string;

  // New fields
  bggId?: number;
  status?: string;
  bggRating?: number;
  bggComplexity?: number;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  thumbnailUrl?: string;
  imageUrl?: string;

  playCount?: number;
  lastPlayedDate?: string; // ISO date string
}
