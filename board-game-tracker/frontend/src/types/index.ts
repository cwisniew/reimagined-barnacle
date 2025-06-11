export interface OtherLink { title: string; url: string; }
export interface CardSet { id:string; categoryName:string; cardCount:number; cardSize?:string; sleevedCount?:number; sleeveNotes?:string; }

// New: PlayerInPlaySession
export interface PlayerInPlaySession {
  id: string; // UUID generated on client when adding to modal
  name: string;
  enjoyment?: number; // e.g., 1-5 scale
  won?: boolean;
  notes?: string;
}
export interface PlaySession {
  id: string; // UUID from backend
  date: string; // ISO date string
  // playerNames?: string[]; // REMOVED
  playersInSession?: PlayerInPlaySession[]; // ADDED
  notes?: string; // Overall session notes
}
export interface BoardGame { /* ... (rest of BoardGame same, uses new PlaySession) ... */
  id: string; name: string; description: string; version?: string; bggId?: number; status?: string;
  bggRating?: number; bggComplexity?: number; yearPublished?: number; minPlayers?: number; maxPlayers?: number;
  playingTime?: number; thumbnailUrl?: string; imageUrl?: string; plays?: PlaySession[]; isExpansion?: boolean;
  baseGameAppId?: string; bggBaseGameId?: number; bggExpansionIds?: number[]; designers?: string[];
  publishers?: string[]; categories?: string[]; mechanics?: string[]; locationRoom?: string;
  locationCupboard?: string; locationShelf?: string; locationNotes?: string; officialWebsiteUrl?: string;
  otherLinks?: OtherLink[]; crowdfundingPlatform?: string; crowdfundingUrl?: string; crowdfundingStatus?: string;
  bggSubdomains?: string[]; bggFamilies?: string[]; manualUrl?: string; cardSets?: CardSet[];
}
