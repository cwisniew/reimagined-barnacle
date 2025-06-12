export interface OtherLink { title: string; url: string; }
export interface CardSet { id:string; categoryName:string; cardCount:number; cardSize?:string; sleevedCount?:number; sleeveNotes?:string; }
export interface PlaySession { id:string; date:string; playersInSession?:PlayerInPlaySession[]; notes?:string; }
export interface PlayerInPlaySession { id:string; name:string; enjoyment?:number; won?:boolean; notes?:string; }
export interface BggVideoLink { title: string; url: string; language?: string; uploader?: string; postDate?: string; }

export interface BoardGame {
  id: string; name: string; description: string; version?: string;
  bggId?: number; status?: string;
  bggRating?: number; bggComplexity?: number; yearPublished?: number;
  minPlayers?: number; maxPlayers?: number; playingTime?: number;
  thumbnailUrl?: string; imageUrl?: string; // BGG images
  userImageUrls?: string[]; // User uploaded images

  plays?: PlaySession[];
  isExpansion?: boolean; baseGameAppId?: string; bggBaseGameId?: number; bggExpansionIds?: number[];
  designers?: string[]; publishers?: string[]; categories?: string[]; mechanics?: string[];
  locationRoom?: string; locationCupboard?: string; locationShelf?: string; locationNotes?: string;
  officialWebsiteUrl?: string; otherLinks?: OtherLink[];
  crowdfundingPlatform?: string; crowdfundingUrl?: string; crowdfundingStatus?: string;
  bggSubdomains?: string[]; bggFamilies?: string[];
  manualUrl?: string; cardSets?: CardSet[];
}
