export interface OtherLink { title: string; url: string; }
export interface BoardGame {
  id: string; name: string; description: string; version?: string;
  bggId?: number; status?: string;
  bggRating?: number; bggComplexity?: number; yearPublished?: number;
  minPlayers?: number; maxPlayers?: number; playingTime?: number;
  thumbnailUrl?: string; imageUrl?: string;
  playCount?: number; lastPlayedDate?: string;
  isExpansion?: boolean; baseGameAppId?: string; bggBaseGameId?: number; bggExpansionIds?: number[];
  designers?: string[]; publishers?: string[]; categories?: string[]; mechanics?: string[];
  locationRoom?: string; locationCupboard?: string; locationShelf?: string; locationNotes?: string;
  officialWebsiteUrl?: string; otherLinks?: OtherLink[];
  crowdfundingPlatform?: string; crowdfundingUrl?: string; crowdfundingStatus?: string;
  bggSubdomains?: string[]; bggFamilies?: string[];
  manualUrl?: string; // New manual URL field
}
