<template>
  <div class="bgg-search">
    <h2>Search BoardGameGeek</h2>
    <div class="search-input">
      <input type="text" v-model="searchQuery" placeholder="Enter game name" @keyup.enter="performSearch" />
      <button @click="performSearch" :disabled="loadingSearch">
        {{ loadingSearch ? "Searching..." : "Search BGG" }}
      </button>
    </div>

    <div v-if="searchError" class="error">{{ searchError }}</div>

    <div v-if="searchResults.length > 0" class="search-results">
      <h3>Search Results</h3>
      <ul>
        <li v-for="item in searchResults" :key="item.id" @click="fetchGameDetails(item.id)" class="result-item">
          {{ item.name?.value || "Unknown Name" }} ({{ item.yearpublished?.value || "N/A" }}) - ID: {{ item.id }}
        </li>
      </ul>
    </div>
    <p v-if="searched && searchResults.length === 0 && !loadingSearch">No results found for "{{ lastSearchQuery }}".</p>

    <div v-if="loadingDetails" class="loading-details">Loading game details...</div>
    <div v-if="gameDetailsError" class="error">{{ gameDetailsError }}</div>
    <div v-if="selectedGameDetails" class="game-details">
      <h3>Details for {{ primaryGameName(selectedGameDetails) }} (ID: {{ selectedGameDetails.id }})</h3>
      <button @click="useThisData" class="use-data-btn">Use Data for New Game</button>
      <button @click="clearDetails" class="clear-details-btn">Clear Details</button>
      <pre>{{ JSON.stringify(selectedGameDetails, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBggFormStore } from "../stores/bggFormStore";

interface BggName { value: string; type?: string; sortindex?: number; }
interface BggYearPublished { value: number; }
interface BggSearchResultItem { id: number; name?: BggName; yearpublished?: BggYearPublished; }
interface BggGameDetails {
  id: number; type?: string; name?: BggName; names?: BggName[];
  description?: { value: string }; yearpublished?: BggYearPublished;
  minplayers?: { value: number }; maxplayers?: { value: number };
  playingtime?: { value: number }; minplaytime?: { value: number };
  maxplaytime?: { value: number }; minage?: { value: number };
  statistics?: { ratings?: { usersrated?: { value: number }; average?: { value: number }; stddev?: { value: number }; }; };
  thumbnail?: { value: string }; image?: { value: string };
  links?: Array<{ type: string; id: number; value: string; }>;
}

const searchQuery = ref("");
const lastSearchQuery = ref("");
const searchResults = ref<BggSearchResultItem[]>([]);
const loadingSearch = ref(false);
const searchError = ref<string | null>(null);
const searched = ref(false);

const selectedGameDetails = ref<BggGameDetails | null>(null);
const loadingDetails = ref(false);
const gameDetailsError = ref<string | null>(null);

const bggFormStore = useBggFormStore();

const primaryGameName = (details: BggGameDetails | null): string => {
  if (!details) return "N/A";
  if (details.name?.value) return details.name.value;
  if (details.names && details.names.length > 0) {
    const primary = details.names.find(n => n.type === "primary");
    if (primary) return primary.value;
    return details.names[0].value;
  }
  return "Unknown Name";
};

async function performSearch() {
  if (!searchQuery.value.trim()) { searchError.value = "Please enter a game name to search."; return; }
  loadingSearch.value = true; searchError.value = null; searchResults.value = [];
  selectedGameDetails.value = null; gameDetailsError.value = null; searched.value = true;
  lastSearchQuery.value = searchQuery.value;
  try {
    const response = await fetch(`/api/bgg/search?name=${encodeURIComponent(searchQuery.value)}`);
    if (!response.ok) { const ed = await response.json().catch(()=>({message:"Search request failed"})); throw new Error(ed.message||"Failed to search BGG"); }
    searchResults.value = await response.json() as BggSearchResultItem[];
  } catch (err: any) { searchError.value = err.message; } finally { loadingSearch.value = false; }
}

async function fetchGameDetails(bggId: number) {
  loadingDetails.value = true; gameDetailsError.value = null; selectedGameDetails.value = null;
  try {
    const response = await fetch(`/api/bgg/game/${bggId}`);
    if (!response.ok) { const ed=await response.json().catch(()=>({message:"Detail fetch failed"})); throw new Error(ed.message||`Failed to fetch details for BGG ID ${bggId}`);}
    selectedGameDetails.value = await response.json() as BggGameDetails;
  } catch (err: any) { gameDetailsError.value = err.message; } finally { loadingDetails.value = false; }
}

function useThisData() {
  if (selectedGameDetails.value) {
    bggFormStore.setBggGameData({
      name: primaryGameName(selectedGameDetails.value),
      description: selectedGameDetails.value.description?.value || "",
      yearPublished: selectedGameDetails.value.yearpublished?.value,
      bggId: selectedGameDetails.value.id,
    });
    alert("Game data has been sent to the Add New Game form!");
  }
}

function clearDetails() {
    selectedGameDetails.value = null;
    gameDetailsError.value = null;
}
</script>

<style scoped>
.bgg-search { margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f0f8ff; }
.search-input { display: flex; gap: 10px; margin-bottom: 15px; }
.search-input input[type="text"] { flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 3px; }
.search-input button { padding: 8px 15px; background-color: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; }
.search-input button:disabled { background-color: #aaa; }
.error { color: red; margin-bottom: 10px; }
.search-results ul { list-style: none; padding: 0; }
.result-item { padding: 8px; border-bottom: 1px solid #eee; cursor: pointer; transition: background-color 0.2s; }
.result-item:hover { background-color: #e9ecef; }
.result-item:last-child { border-bottom: none; }
.loading-details, .game-details { margin-top: 15px; padding: 10px; border: 1px solid #ccc; background-color: #fff; }
.game-details pre { white-space: pre-wrap; word-wrap: break-word; background-color: #f8f9fa; padding: 10px; border-radius: 3px; max-height: 400px; overflow-y: auto; }
.use-data-btn { background-color: #17a2b8; color: white; border: none; padding: 8px 12px; border-radius: 3px; cursor: pointer; margin-right: 10px; margin-bottom: 10px; }
.clear-details-btn { background-color: #ffc107; color: #212529; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-bottom: 10px; }
</style>
