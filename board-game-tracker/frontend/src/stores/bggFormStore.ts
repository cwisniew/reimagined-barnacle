import { defineStore } from "pinia";

// This interface should capture all fields we want to potentially auto-fill from BGG
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
  // We can add more fields here if BGG API provides them and we want to use them
}

// Helper to safely get string value from BGG name objects/arrays
const getBggName = (nameField: any): string | undefined => {
  if (!nameField) return undefined;
  if (typeof nameField === "string") return nameField; // Should not happen with this client
  if (Array.isArray(nameField)) { // e.g. gameDetails.names
    const primary = nameField.find(n => n.type === "primary");
    return primary?.value || nameField[0]?.value;
  }
  return nameField.value; // e.g. gameDetails.name.value or searchResult.name.value
};

// Helper to clean up BGG descriptions
const cleanBggDescription = (desc: string | undefined): string => {
  if (!desc) return "";
  let cleanedDesc = desc;
  try {
    // Basic HTML entity decoding and tag stripping
    // This is client-side, so document should be available.
    // For a more robust solution, consider a library or server-side cleaning.
    const tempEl = document.createElement("div");
    tempEl.innerHTML = cleanedDesc;
    cleanedDesc = tempEl.textContent || tempEl.innerText || "";
  } catch (e) {
    // Fallback for environments where document is not available or other errors
    cleanedDesc = cleanedDesc
      .replace(/<br\s*\/?>/gi, "\n") // Replace <br> with newlines
      .replace(/<[^>]+>/g, "") // Strip other HTML tags
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
      .replace(/&#10;/g, "\n") // Newline character
      .replace(/&nbsp;/g, " ")
      .replace(/&rsquo;/g, "’")
      .replace(/&ldquo;/g, "“")
      .replace(/&rdquo;/g, "”")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–");
  }
  return cleanedDesc.trim();
};


export const useBggFormStore = defineStore("bggForm", {
  state: () => ({
    bggGameDataForForm: null as BggGameDataForForm | null,
  }),
  actions: {
    setBggGameData(rawBggData: any) { // rawBggData is the direct JSON from bggClient.thing.query
      if (!rawBggData) {
        this.bggGameDataForForm = null;
        return;
      }

      this.bggGameDataForForm = {
        name: getBggName(rawBggData.name || rawBggData.names),
        description: cleanBggDescription(rawBggData.description?.value),
        yearPublished: rawBggData.yearpublished?.value,
        bggId: rawBggData.id,
        bggRating: parseFloat(rawBggData.statistics?.ratings?.average?.value?.toFixed(2)) || undefined,
        bggComplexity: parseFloat(rawBggData.statistics?.ratings?.averageweight?.value?.toFixed(2)) || undefined,
        minPlayers: rawBggData.minplayers?.value,
        maxPlayers: rawBggData.maxplayers?.value,
        playingTime: rawBggData.playingtime?.value || rawBggData.minplaytime?.value, // BGG has playingtime, minplaytime, maxplaytime
        thumbnailUrl: rawBggData.thumbnail?.value,
        imageUrl: rawBggData.image?.value,
      };
    },
    clearBggGameData() {
      this.bggGameDataForForm = null;
    },
    // getProcessedBggData is no longer strictly needed if AddBoardGameForm directly uses bggGameDataForForm properties
  },
});
