import { defineStore } from "pinia";

export interface BggGameDataForForm {
  name?: string;
  description?: string;
  yearPublished?: number;
  bggId?: number;
  bggRating?: number;
  bggComplexity?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  thumbnailUrl?: string;
  imageUrl?: string;

  isExpansionFromBgg?: boolean;
  bggBaseGameIdFromBgg?: number;
  bggExpansionIdsFromBgg?: number[];

  // New fields for designers, publishers, etc. from BGG
  designersFromBgg?: string[];
  publishersFromBgg?: string[];
  categoriesFromBgg?: string[];
  mechanicsFromBgg?: string[];
}

// Helper to safely get string value from BGG name objects/arrays
const getBggName = (nameField: any): string | undefined => {
  if (!nameField) return undefined;
  if (typeof nameField === "string") return nameField;
  if (Array.isArray(nameField)) {
    const primary = nameField.find(n => n.type === "primary");
    return primary?.value || nameField[0]?.value;
  }
  return nameField.value;
};
// Helper to clean up BGG descriptions
const cleanBggDescription = (desc: string | undefined): string => {
  if (!desc) return "";
  let cleanedDesc = desc;
  try {
    const tempEl = document.createElement("div"); tempEl.innerHTML = cleanedDesc;
    cleanedDesc = tempEl.textContent || tempEl.innerText || "";
  } catch (e) {
    cleanedDesc = cleanedDesc.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&#10;/g, "\n")
      .replace(/&nbsp;/g, " ").replace(/&rsquo;/g, "’").replace(/&ldquo;/g, "“")
      .replace(/&rdquo;/g, "”").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–");
  }
  return cleanedDesc.trim();
};

export const useBggFormStore = defineStore("bggForm", {
  state: () => ({
    bggGameDataForForm: null as BggGameDataForForm | null,
  }),
  actions: {
    setBggGameData(rawBggData: any) { // rawBggData is the direct JSON from bggClient.thing.query
      if (!rawBggData) { this.bggGameDataForForm = null; return; }
      this.bggGameDataForForm = {
        name: getBggName(rawBggData.name || rawBggData.names),
        description: cleanBggDescription(rawBggData.description?.value),
        yearPublished: rawBggData.yearpublished?.value,
        bggId: rawBggData.id,
        bggRating: parseFloat(rawBggData.statistics?.ratings?.average?.value?.toFixed(2)) || undefined,
        bggComplexity: parseFloat(rawBggData.statistics?.ratings?.averageweight?.value?.toFixed(2)) || undefined,
        minPlayers: rawBggData.minplayers?.value,
        maxPlayers: rawBggData.maxplayers?.value,
        playingTime: rawBggData.playingtime?.value || rawBggData.minplaytime?.value,
        thumbnailUrl: rawBggData.thumbnail?.value,
        imageUrl: rawBggData.image?.value,
        isExpansionFromBgg: rawBggData._isExpansionFromBgg,
        bggBaseGameIdFromBgg: rawBggData._bggBaseGameIdFromBgg,
        bggExpansionIdsFromBgg: rawBggData._bggExpansionIdsFromBgg,
        // Populate new array fields from augmented backend response
        designersFromBgg: rawBggData._designers || [],
        publishersFromBgg: rawBggData._publishers || [],
        categoriesFromBgg: rawBggData._categories || [],
        mechanicsFromBgg: rawBggData._mechanics || [],
      };
    },
    clearBggGameData() { this.bggGameDataForForm = null; },
  },
});
