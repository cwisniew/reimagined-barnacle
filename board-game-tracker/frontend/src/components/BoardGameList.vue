<template>
  <div class="game-list-container">
    <h2>My Board Games ({{ filteredGames.length }} / {{ boardGameStore.games.length }})</h2>
    <div class="controls"><button @click="fetchGamesWithLoading" :disabled="boardGameStore.loading" class="refresh-btn">Refresh</button>
      <div class="filter-status"><label for="statusFilter">Filter:</label><select id="statusFilter" v-model="selectedStatus">
          <option value="">All</option><option v-for="s in availableStatuses" :key="s" :value="s">{{s}}</option></select></div></div>

    <div v-if="boardGameStore.loading && initialLoad">Loading...</div>
    <div v-else-if="boardGameStore.error && !boardGameStore.loading" class="error">Error: {{ boardGameStore.error }}</div>

    <ul v-else-if="filteredGames.length > 0" class="game-list">
      <li v-for="game in filteredGames" :key="game.id" class="game-item" :class="{ 'is-expansion-item': game.isExpansion }">
        <div class="game-thumbnail" v-if="game.thumbnailUrl"><img :src="game.thumbnailUrl" :alt="game.name + ` thumbnail`"/></div>
        <div class="game-info">
          <h3>{{ game.name }} <span v-if="game.isExpansion" class="expansion-tag">[Exp]</span></h3>
          <div v-if="game.isExpansion && game.baseGameAppId" class="base-game-link"><p>Exp for: <strong>{{ getBaseGameName(game.baseGameAppId) || "Unknown" }}</strong></p></div>
          <div v-else-if="game.isExpansion && game.bggBaseGameId" class="base-game-link"><p>Exp for BGG ID: {{game.bggBaseGameId}}</p></div>

          <p v-if="game.yearPublished" class="game-meta">Year: {{ game.yearPublished }} <span v-if="game.version && game.version !== game.yearPublished.toString()">| V: {{ game.version }}</span></p>
          <p v-if="game.status" class="game-meta status-tag">Status: <strong>{{ game.status }}</strong></p>

          <!-- Location Info -->
          <div v-if="game.locationRoom || game.locationCupboard || game.locationShelf || game.locationNotes" class="location-info game-meta">
            📍 <strong>Location:</strong>
            <template v-if="game.locationRoom">{{ game.locationRoom }}</template>
            <template v-if="game.locationCupboard"><span v-if="game.locationRoom"> &gt; </span>{{ game.locationCupboard }}</template>
            <template v-if="game.locationShelf"><span v-if="game.locationRoom || game.locationCupboard"> &gt; </span>Shelf {{ game.locationShelf }}</template>
            <template v-if="game.locationNotes"> ({{ game.locationNotes }})</template>
          </div>

          <div class="game-tags">
            <span v-if="game.designers && game.designers.length" class="tag designers-tag" :title="game.designers.join(', ')">🧑‍🎨 {{game.designers[0]}}<span v-if="game.designers.length>1">...</span></span>
            <span v-if="game.publishers && game.publishers.length" class="tag publishers-tag" :title="game.publishers.join(', ')">🏢 {{game.publishers[0]}}<span v-if="game.publishers.length>1">...</span></span>
            <span v-if="game.categories && game.categories.length" class="tag category-tag" :title="game.categories.join(', ')">{{game.categories.slice(0,2).join(", ")}}<span v-if="game.categories.length > 2">...</span></span>
            <span v-if="game.mechanics && game.mechanics.length" class="tag mechanic-tag" :title="game.mechanics.join(', ')">{{game.mechanics.slice(0,2).join(", ")}}<span v-if="game.mechanics.length > 2">...</span></span>
          </div>
          <p class="game-description">{{ game.description }}</p>
          <div class="game-stats">
            <span v-if="game.bggRating">⭐ {{ game.bggRating?.toFixed(1) }}/10</span>
            <span v-if="game.bggComplexity">⚖️ {{ game.bggComplexity?.toFixed(2) }}</span>
            <span v-if="game.minPlayers && game.maxPlayers">👥 {{ game.minPlayers }}-{{ game.maxPlayers }}</span>
            <span v-if="game.playingTime">⏱️ {{ game.playingTime }} min</span>
          </div>
          <div class="play-stats">
            <span>Plays: <strong>{{ game.playCount||0 }}</strong></span>
            <span v-if="game.lastPlayedDate">Last: <strong>{{ formatDate(game.lastPlayedDate) }}</strong></span>
            <button @click="handleLogPlay(game.id)" :disabled="loggingPlay[game.id]" class="log-play-btn">Log Play</button>
          </div>
          <p v-if="game.bggId" class="game-meta bgg-link"><a :href="`https://boardgamegeek.com/boardgame/${game.bggId}`" target="_blank">BGG (ID: {{game.bggId}})</a></p>
          <div v-if="game.bggExpansionIds && game.bggExpansionIds.length" class="expansions-list"><strong>Expansions (BGG):</strong>
            <ul><li v-for="id in game.bggExpansionIds" :key="id">ID:{{id}} - {{getExpansionNameFromCollection(id)||"N/A"}}</li></ul></div>
        </div>
      </li>
    </ul>
    <p v-else-if="boardGameStore.games.length > 0 && filteredGames.length === 0">No games match filter.</p>
    <p v-else>No games in collection.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";
const boardGameStore = useBoardGameStore();
const initialLoad = ref(true); const loggingPlay = reactive<Record<string,boolean>>({});
const selectedStatus = ref(""); const availableStatuses = ref(["Owned", "Wishlist", "Played", "Unopened", "Shrink-wrapped", "Preordered", "Sold"]);
const fetchGamesWithLoading = async () => { initialLoad.value = true; await boardGameStore.fetchGames(); initialLoad.value = false; };
onMounted(async () => { if (boardGameStore.games.length === 0) { initialLoad.value = true; await boardGameStore.fetchGames(); initialLoad.value = false; } else { initialLoad.value = false; } });
const formatDate = (ds?: string) => ds ? new Date(ds).toLocaleDateString() : "";
const handleLogPlay = async (id: string) => { loggingPlay[id] = true; await boardGameStore.logPlay(id); loggingPlay[id] = false; };
const filteredGames = computed(() => boardGameStore.games.filter(g => !selectedStatus.value || g.status === selectedStatus.value));
const getBaseGameName = (id: string) => boardGameStore.games.find(g=>g.id===id)?.name;
const getExpansionNameFromCollection = (id:number) => boardGameStore.games.find(g=>g.bggId===id && g.isExpansion)?.name;
</script>

<style scoped>
.game-list-container{padding:10px;background-color:#fff;border-radius:5px}
.controls{margin-bottom:15px;display:flex;gap:15px;align-items:center;flex-wrap:wrap}
.refresh-btn{padding:8px 12px;cursor:pointer;background-color:#6c757d;color:#fff;border:none;border-radius:3px}
.filter-status{display:flex;align-items:center;gap:5px}
.filter-status label{font-size:.9em}
.filter-status select{padding:6px;border-radius:3px;border:1px solid #ccc;font-size:.9em}
.error{color:red}
.game-list{list-style:none;padding:0}
.game-item{display:flex;gap:15px;padding:15px;margin-bottom:15px;border:1px solid #eee;border-radius:4px;background-color:#fdfdfd;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.is-expansion-item{background-color:#f0f8ff;border-left:3px solid #007bff}
.game-thumbnail img{width:80px;height:auto;max-height:120px;object-fit:cover;border-radius:3px;border:1px solid #ddd}
.game-info{flex-grow:1}
.game-info h3{margin-top:0;margin-bottom:5px;color:#333}
.expansion-tag{font-size:.8em;color:#007bff;font-weight:700;margin-left:5px}
.base-game-link,.expansions-list{font-size:.85em;margin:5px 0;padding-left:10px;border-left:2px solid #eee}
.expansions-list ul{list-style:circle;padding-left:20px;margin:5px 0 0}
.expansions-list li{font-size:.95em}
.game-description{font-size:.9em;color:#555;margin-bottom:10px}
.game-meta{font-size:.85em;color:#777;margin:3px 0}
.status-tag strong{display:inline-block;padding:2px 6px;background-color:#007bff;color:#fff;border-radius:3px;font-size:.9em}
.game-stats{display:flex;flex-wrap:wrap;gap:10px;font-size:.85em;color:#444;margin:10px 0}
.game-stats span{background-color:#e9ecef;padding:3px 7px;border-radius:3px;white-space:nowrap}
.play-stats{margin-top:10px;padding-top:10px;border-top:1px dashed #eee;font-size:.9em}
.play-stats span{margin-right:15px}
.log-play-btn{padding:4px 8px;font-size:.8em;background-color:#28a745;color:#fff;border:none;border-radius:3px;cursor:pointer}
.log-play-btn:disabled{background-color:#aaa}
.bgg-link{margin-top:10px}
.game-tags{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0;font-size:.8em}
.tag{padding:2px 6px;border-radius:3px;background-color:#f0f0f0;color:#333}
.designers-tag{background-color:#cfe2ff}
.publishers-tag{background-color:#d1e7dd}
.category-tag{background-color:#f8d7da}
.mechanic-tag{background-color:#fff3cd}
.location-info { background-color: #fafad2; padding: 3px 6px; border-radius: 3px; margin-top: 5px; font-size: 0.85em; color: #555; }
.location-info strong { color: #333; }
</style>
