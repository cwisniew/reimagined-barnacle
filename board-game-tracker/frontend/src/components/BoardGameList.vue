<template>
  <div class="game-list-container">
    <h2>My Board Games</h2>

    <div class="controls">
      <button @click="fetchGamesWithLoading" :disabled="boardGameStore.loading" class="refresh-btn">
        {{ boardGameStore.loading && initialLoad ? "Refreshing..." : "Refresh Games" }}
      </button>
      <div class="filter-status">
        <label for="statusFilter">Filter by Status:</label>
        <select id="statusFilter" v-model="selectedStatus">
          <option value="">All Statuses</option>
          <option v-for="status in availableStatuses" :key="status" :value="status">
            {{ status }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="boardGameStore.loading && initialLoad">Loading games...</div>
    <div v-else-if="boardGameStore.error && !boardGameStore.loading" class="error">Error: {{ boardGameStore.error }}</div>

    <ul v-else-if="filteredGames.length > 0" class="game-list">
      <li v-for="game in filteredGames" :key="game.id" class="game-item">
        <div class="game-thumbnail" v-if="game.thumbnailUrl">
          <img :src="game.thumbnailUrl" :alt="game.name + ` thumbnail`" />
        </div>
        <div class="game-info">
          <h3>{{ game.name }}</h3>
          <p v-if="game.version" class="game-meta">Version: {{ game.version }}</p>
          <p v-if="game.yearPublished" class="game-meta">Year: {{ game.yearPublished }}</p>
          <p v-if="game.status" class="game-meta status-tag">Status: <strong>{{ game.status }}</strong></p>
          <p class="game-description">{{ game.description }}</p>

          <div class="game-stats">
            <span v-if="game.bggRating" title="BGG Rating">⭐ {{ game.bggRating?.toFixed(1) }}/10</span>
            <span v-if="game.bggComplexity" title="BGG Complexity (Weight)">⚖️ {{ game.bggComplexity?.toFixed(2) }}</span>
            <span v-if="game.minPlayers && game.maxPlayers" title="Players">👥 {{ game.minPlayers }}-{{ game.maxPlayers }}</span>
            <span v-if="game.playingTime" title="Playing Time">⏱️ {{ game.playingTime }} min</span>
          </div>

          <div class="play-stats">
            <span>Plays: <strong>{{ game.playCount || 0 }}</strong></span>
            <span v-if="game.lastPlayedDate">Last Played: <strong>{{ formatDate(game.lastPlayedDate) }}</strong></span>
            <button @click="handleLogPlay(game.id)" :disabled="loggingPlay[game.id]" class="log-play-btn">
              {{ loggingPlay[game.id] ? "Logging..." : "Log Play" }}
            </button>
          </div>
           <p v-if="game.bggId" class="game-meta bgg-link">
            <a :href="`https://boardgamegeek.com/boardgame/${game.bggId}`" target="_blank" rel="noopener noreferrer">View on BGG (ID: {{ game.bggId }})</a>
          </p>
        </div>
      </li>
    </ul>
    <p v-else-if="boardGameStore.games.length > 0 && filteredGames.length === 0">
      No games match the current filter.
    </p>
    <p v-else>No games in your collection yet. Add some!</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue"; // Added computed
import { useBoardGameStore } from "../stores/boardGameStore";
import type { BoardGame } from "../types"; // Import BoardGame type

const boardGameStore = useBoardGameStore();
const initialLoad = ref(true);
const loggingPlay = reactive<Record<string, boolean>>({});

const selectedStatus = ref(""); // For the filter dropdown
const availableStatuses = ref([ // Could be dynamic in future
  "Owned", "Wishlist", "Played", "Unopened", "Shrink-wrapped", "Preordered", "Sold"
]);

const fetchGamesWithLoading = async () => {
  initialLoad.value = true;
  await boardGameStore.fetchGames();
  initialLoad.value = false;
};

onMounted(async () => {
  if (boardGameStore.games.length === 0) {
    initialLoad.value = true; // Set initialLoad true before fetching
    await boardGameStore.fetchGames();
    initialLoad.value = false; // Set back to false after fetch
  } else {
    initialLoad.value = false; // Games already loaded
  }
});

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString();
};

const handleLogPlay = async (gameId: string) => {
  loggingPlay[gameId] = true;
  const success = await boardGameStore.logPlay(gameId);
  if (!success) {
    alert(`Failed to log play for game ID ${gameId}. Check console for errors.`);
  }
  // No need to manually delete loggingPlay[gameId] if you prefer to keep the state
  // for potential re-tries or just let it be overwritten on next interaction.
  // For a cleaner approach, you might delete it or set to false:
  loggingPlay[gameId] = false;
};

// Computed property for filtered games
const filteredGames = computed(() => {
  if (!selectedStatus.value) {
    return boardGameStore.games; // No filter applied
  }
  return boardGameStore.games.filter(game => game.status === selectedStatus.value);
});

</script>

<style scoped>
.game-list-container { padding: 10px; background-color: #fff; border-radius: 5px; }
.controls {
  margin-bottom: 15px;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}
.refresh-btn { /* Specific class for refresh button */
  padding: 8px 12px;
  cursor: pointer;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
}
.filter-status { display: flex; align-items: center; gap: 5px; }
.filter-status label { font-size: 0.9em; }
.filter-status select { padding: 6px; border-radius: 3px; border: 1px solid #ccc; font-size:0.9em; }

.error { color: red; }
.game-list { list-style: none; padding: 0; }
.game-item { display: flex; gap: 15px; padding: 15px; margin-bottom: 15px; border: 1px solid #eee; border-radius: 4px; background-color: #fdfdfd; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.game-thumbnail img { width: 80px; height: auto; max-height: 120px; object-fit: cover; border-radius: 3px; border: 1px solid #ddd; }
.game-info { flex-grow: 1; }
.game-info h3 { margin-top: 0; margin-bottom: 5px; color: #333; }
.game-description { font-size: 0.9em; color: #555; margin-bottom: 10px; }
.game-meta { font-size: 0.85em; color: #777; margin: 3px 0; }
.status-tag strong { display: inline-block; padding: 2px 6px; background-color: #007bff; color: white; border-radius: 3px; font-size: 0.9em; }
.game-stats { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.85em; color: #444; margin: 10px 0; }
.game-stats span { background-color: #e9ecef; padding: 3px 7px; border-radius: 3px; white-space: nowrap; }
.play-stats { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; font-size: 0.9em; }
.play-stats span { margin-right: 15px; }
.log-play-btn { padding: 4px 8px; font-size: 0.8em; background-color: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; }
.log-play-btn:disabled { background-color: #aaa; }
.bgg-link { margin-top: 10px; }
</style>
