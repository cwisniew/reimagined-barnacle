export interface OtherLink { title: string; url: string; }
export interface CardSet { id:string; categoryName:string; cardCount:number; cardSize?:string; sleevedCount?:number; sleeveNotes?:string; }
export interface PlaySession { id:string; date:string; playersInSession?:PlayerInPlaySession[]; notes?:string; }
export interface PlayerInPlaySession { id:string; name:string; enjoyment?:number; won?:boolean; notes?:string; }
export interface BggVideoLink { title: string; url: string; language?: string; uploader?: string; postDate?: string; }
export interface BggReimplementation { bggId: number; name: string; }

// New: GameAttachment interface
export interface GameAttachment {
  id: string; // UUID generated on client when staging for upload/add to form
  title: string;
  fileUrl: string; // URL path returned by backend upload endpoint
  originalName: string;
  fileType?: string; // MIME type
  uploadedAt: string; // ISO date string when added to game (can be different from file system timestamp)
  notes?: string;
}

export interface BoardGame {
  id: string; name: string; description: string; version?: string;
  bggId?: number; status?: string;
  bggRating?: number; bggComplexity?: number; yearPublished?: number;
  minPlayers?: number; maxPlayers?: number; playingTime?: number;
  thumbnailUrl?: string; imageUrl?: string; userImageUrls?: string[];
  plays?: PlaySession[];
  isExpansion?: boolean; baseGameAppId?: string; bggBaseGameId?: number; bggExpansionIds?: number[];
  designers?: string[]; publishers?: string[]; categories?: string[]; mechanics?: string[];
  locationRoom?: string; locationCupboard?: string; locationShelf?: string; locationNotes?: string;
  officialWebsiteUrl?: string; otherLinks?: OtherLink[];
  crowdfundingPlatform?: string; crowdfundingUrl?: string; crowdfundingStatus?: string;
  bggSubdomains?: string[]; bggFamilies?: string[];
  onlineManualUrl?: string; localManualUrl?: string;
  bggReimplementations?: BggReimplementation[];
  bggVideoLinks?: BggVideoLink[];
  cardSets?: CardSet[];
  attachments?: GameAttachment[]; // New field
}
