import { defineStore } from "pinia";
export interface BggGameDataForForm {
  name?: string; description?: string; yearPublished?: number; bggId?: number;
  bggRating?: number; bggComplexity?: number; minPlayers?: number; maxPlayers?: number;
  playingTime?: number; thumbnailUrl?: string; imageUrl?: string;
  isExpansionFromBgg?: boolean; bggBaseGameIdFromBgg?: number; bggExpansionIdsFromBgg?: number[];
  designersFromBgg?: string[]; publishersFromBgg?: string[]; categoriesFromBgg?: string[]; mechanicsFromBgg?: string[];
  officialWebsiteFromBgg?: string;
  // New fields for BGG subdomains and families
  bggSubdomainsFromBgg?: string[];
  bggFamiliesFromBgg?: string[];
}
const getBggName=(nf:any):string|undefined => {if(!nf)return undefined;if(typeof nf==="string")return nf;if(Array.isArray(nf)){const p=nf.find(n=>n.type==="primary");return p?.value||nf[0]?.value;}return nf.value;};
const cleanBggDesc=(d?:string):string => {if(!d)return "";let cd=d;try{const te=document.createElement("div");te.innerHTML=cd;cd=te.textContent||te.innerText||"";}catch(e){cd=cd.replace(/<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,"\"").replace(/&apos;/g,"'").replace(/&#10;/g,"\n").replace(/&nbsp;/g," ").replace(/&rsquo;/g,"’").replace(/&ldquo;/g,"“").replace(/&rdquo;/g,"”").replace(/&mdash;/g,"—").replace(/&ndash;/g,"–");}return cd.trim();};

export const useBggFormStore = defineStore("bggForm", {
  state: () => ({ bggGameDataForForm: null as BggGameDataForForm | null }),
  actions: {
    setBggGameData(rawBggData: any) {
      if (!rawBggData) { this.bggGameDataForForm = null; return; }
      this.bggGameDataForForm = {
        name: getBggName(rawBggData.name || rawBggData.names), description: cleanBggDesc(rawBggData.description?.value),
        yearPublished: rawBggData.yearpublished?.value, bggId: rawBggData.id,
        bggRating: parseFloat(rawBggData.statistics?.ratings?.average?.value?.toFixed(2)) || undefined,
        bggComplexity: parseFloat(rawBggData.statistics?.ratings?.averageweight?.value?.toFixed(2)) || undefined,
        minPlayers: rawBggData.minplayers?.value, maxPlayers: rawBggData.maxplayers?.value,
        playingTime: rawBggData.playingtime?.value || rawBggData.minplaytime?.value,
        thumbnailUrl: rawBggData.thumbnail?.value, imageUrl: rawBggData.image?.value,
        isExpansionFromBgg: rawBggData._isExpansionFromBgg, bggBaseGameIdFromBgg: rawBggData._bggBaseGameIdFromBgg,
        bggExpansionIdsFromBgg: rawBggData._bggExpansionIdsFromBgg,
        designersFromBgg: rawBggData._designers || [], publishersFromBgg: rawBggData._publishers || [],
        categoriesFromBgg: rawBggData._categories || [], mechanicsFromBgg: rawBggData._mechanics || [],
        officialWebsiteFromBgg: rawBggData._officialWebsiteFromBgg,
        // Populate new BGG classification fields
        bggSubdomainsFromBgg: rawBggData._bggSubdomains || [],
        bggFamiliesFromBgg: rawBggData._bggFamilies || [],
      };
    },
    clearBggGameData() { this.bggGameDataForForm = null; },
  },
});
