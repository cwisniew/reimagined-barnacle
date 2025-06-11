export interface OtherLink { title: string; url: string; }

export interface CardSet {
  id: string; // UUID generated on client during add
  categoryName: string;
  cardCount: number;
  cardSize?: string;
  sleevedCount?: number;
  sleeveNotes?: string;
}

export interface PlaySession { // New interface for detailed plays
  id: string; // UUID generated on backend when adding
  date: string; // ISO date string
  playerNames?: string[];
  notes?: string;
}

export interface BoardGame {
  id: string; name: string; description: string; version?: string;
  bggId?: number; status?: string;
  bggRating?: number; bggComplexity?: number; yearPublished?: number;
  minPlayers?: number; maxPlayers?: number; playingTime?: number;
  thumbnailUrl?: string; imageUrl?: string;
  // playCount?: number; // REMOVED
  // lastPlayedDate?: string; // REMOVED
  plays?: PlaySession[]; // ADDED for detailed play logging

  isExpansion?: boolean; baseGameAppId?: string; bggBaseGameId?: number; bggExpansionIds?: number[];
  designers?: string[]; publishers?: string[]; categories?: string[]; mechanics?: string[];
  locationRoom?: string; locationCupboard?: string; locationShelf?: string; locationNotes?: string;
  officialWebsiteUrl?: string; otherLinks?: OtherLink[];
  crowdfundingPlatform?: string; crowdfundingUrl?: string; crowdfundingStatus?: string;
  bggSubdomains?: string[]; bggFamilies?: string[];
  manualUrl?: string;
  cardSets?: CardSet[];
}
