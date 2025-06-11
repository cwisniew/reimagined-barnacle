import { defineStore } from "pinia";

// Mirror relevant parts of BggGameDetails from BggSearch.vue for type safety
// Or import if structure is stable and shared. For now, defining explicitly.
interface BggGameData {
  name?: string;
  description?: string;
  yearPublished?: number;
  bggId?: number;
  // Potentially other fields like thumbnail, etc.
}

export const useBggFormStore = defineStore("bggForm", {
  state: () => ({
    bggGameDataForForm: null as BggGameData | null,
  }),
  actions: {
    setBggGameData(data: BggGameData) {
      this.bggGameDataForForm = data;
    },
    clearBggGameData() {
      this.bggGameDataForForm = null;
    },
    getProcessedBggData(): { name: string; description: string; version: string; bggId: number | undefined } {
      if (!this.bggGameDataForForm) {
        return { name: "", description: "", version: "", bggId: undefined };
      }
      // Basic HTML tag stripping and entity decoding for description
      let desc = this.bggGameDataForForm.description || "";
      try {
        const tempEl = document.createElement("div");
        tempEl.innerHTML = desc;
        desc = tempEl.textContent || tempEl.innerText || "";
      } catch (e) {
        // If document is not available (e.g. SSR, or for safety)
        // A more robust solution might be needed for complex HTML, or do this on backend.
        desc = desc.replace(/<[^>]+>/g, "").replace(/&rsquo;/g, "'").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&quot;/g, "\"").replace(/&amp;/g, "&"); // common entities
      }


      return {
        name: this.bggGameDataForForm.name || "",
        description: desc,
        version: this.bggGameDataForForm.yearPublished?.toString() || "",
        bggId: this.bggGameDataForForm.bggId,
      };
    }
  },
});
