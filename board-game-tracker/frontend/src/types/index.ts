export interface BoardGame {
  id: string;
  name: string;
  description: string;
  version?: string;

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
  lastPlayedDate?: string;

  isExpansion?: boolean;
  baseGameAppId?: string;
  bggBaseGameId?: number;
  bggExpansionIds?: number[];

  designers?: string[];
  publishers?: string[];
  categories?: string[];
  mechanics?: string[];

  // New location fields
  locationRoom?: string;
  locationCupboard?: string;
  locationShelf?: string;
  locationNotes?: string;
}
