<template>
  <div class="game-list-container">
    <h2>My Board Games ({{ filteredGames.length }} / {{ boardGameStore.games.length }})</h2>
    <div class="controls">
      <button @click="fetchGamesWithLoading" :disabled="boardGameStore.loading" class="refresh-btn">Refresh</button>
      <div class="filter-status"><label for="statusFilter">Filter:</label><select id="statusFilter" v-model="selectedStatus">
        <option value="">All</option><option v-for="s in statusFilterOptions" :key="s" :value="s">{{s}}</option></select></div>
    </div>
    <div v-if="boardGameStore.loading && initialLoad">Loading...</div>
    <div v-else-if="boardGameStore.error && !boardGameStore.loading" class="error">Error: {{ boardGameStore.error }}</div>
    <ul v-else-if="filteredGames.length > 0" class="game-list">
      <li v-for="game in filteredGames" :key="game.id" class="game-item" :class="[{ 'is-expansion-item': game.isExpansion }, statusClass(game.status)]">
        <div class="game-thumbnail" v-if="game.thumbnailUrl"><img :src="game.thumbnailUrl" :alt="game.name + ` thumbnail`"/></div>
        <div class="game-info">
          <h3>{{ game.name }} <span v-if="game.isExpansion" class="expansion-tag">[Exp]</span></h3>
          <p v-if="game.yearPublished" class="game-meta">Year: {{ game.yearPublished }} <span v-if="game.version && game.version !== game.yearPublished.toString()">| V: {{ game.version }}</span></p>
          <p v-if="game.status" class="game-meta status-tag" :class="statusClass(game.status)">Status: <strong>{{ game.status }}</strong></p>
          <div v-if="game.crowdfundingPlatform" class="crowdfunding-info game-meta">📦 {{ game.crowdfundingPlatform }}<span v-if="game.crowdfundingStatus"> ({{game.crowdfundingStatus}})</span></div>
          <div v-if="game.locationRoom" class="location-info game-meta">📍 {{game.locationRoom}}</div>

          <div class="game-tags">
            <span v-if="game.designers&&game.designers.length" class="tag designers-tag">🧑‍🎨 {{game.designers.join(', ')}}</span>
            <span v-if="game.publishers&&game.publishers.length" class="tag publishers-tag">🏢 {{game.publishers.join(', ')}}</span>
            <span v-if="game.categories&&game.categories.length" class="tag category-tag">{{game.categories.join(', ')}}</span>
            <span v-if="game.mechanics&&game.mechanics.length" class="tag mechanic-tag">{{game.mechanics.join(', ')}}</span>
            <span v-if="game.bggSubdomains&&game.bggSubdomains.length" class="tag subdomain-tag">🌐 {{game.bggSubdomains.join(', ')}}</span>
            <span v-if="game.bggFamilies&&game.bggFamilies.length" class="tag family-tag">👪 {{game.bggFamilies.join(', ')}}</span>
          </div>
          <p class="game-description">{{ game.description }}</p>
          <div class="game-stats">
            <span v-if="game.bggRating">⭐ {{ game.bggRating?.toFixed(1) }}/10</span>
            <span v-if="game.bggComplexity">⚖️ {{ game.bggComplexity?.toFixed(2) }}</span>
          </div>
          <div class="web-links-section game-meta">
            <a v-if="game.officialWebsiteUrl" :href="game.officialWebsiteUrl" target="_blank" class="game-link">Official</a>
            <a v-if="game.manualUrl" :href="game.manualUrl" target="_blank" class="game-link">Manual</a>
            <a v-for="(l,i) in game.otherLinks" :key="i" :href="l.url" target="_blank" class="game-link">{{l.title||'Link'}}</a>
          </div>
          <div class="play-stats">
            <span>Plays: <strong>{{ game.playCount||0 }}</strong></span>
            <span v-if="game.lastPlayedDate">Last: <strong>{{ formatDate(game.lastPlayedDate) }}</strong></span>
            <button @click="handleLogPlay(game.id)" :disabled="loggingPlay[game.id]" class="log-play-btn">Log Play</button>
          </div>
          <p v-if="game.bggId" class="game-meta bgg-link"><a :href="`https://boardgamegeek.com/boardgame/${game.bggId}`" target="_blank">BGG (ID: {{game.bggId}})</a></p>
        </div>
      </li>
    </ul>
    <p v-else>No games.</p>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";
const boardGameStore = useBoardGameStore();
const initialLoad = ref(true); const loggingPlay = reactive<Record<string,boolean>>({});
const selectedStatus = ref("");
const statusFilterOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);
const availableStatuses = statusFilterOptions;

const fetchGamesWithLoading=async()=>{initialLoad.value=true;await boardGameStore.fetchGames();initialLoad.value=false;};
onMounted(async()=>{if(boardGameStore.games.length===0){initialLoad.value=true;await boardGameStore.fetchGames();initialLoad.value=false;}else{initialLoad.value=false;}});
const formatDate=(ds?:string)=>ds?new Date(ds).toLocaleDateString():"";
const handleLogPlay=async(id:string)=>{loggingPlay[id]=true;await boardGameStore.logPlay(id);loggingPlay[id]=false;};
const filteredGames=computed(()=>boardGameStore.games.filter(g=>!selectedStatus.value||g.status===selectedStatus.value));
const getBaseGameName=(id:string)=>boardGameStore.games.find(g=>g.id===id)?.name;
const getExpansionNameFromCollection=(id:number)=>boardGameStore.games.find(g=>g.bggId===id&&g.isExpansion)?.name;
const statusClass = (status?: string): string => {
  if (!status) return "";
  return `status-${status.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
};
</script>
<style scoped>
.game-list-container{padding:10px;background-color:#fff;border-radius:5px}
.game-tags{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0;font-size:.8em}
.tag{padding:2px 6px;border-radius:3px;background-color:#f0f0f0;color:#333}
.designers-tag{background-color:#cfe2ff} .publishers-tag{background-color:#d1e7dd}
.category-tag{background-color:#f8d7da} .mechanic-tag{background-color:#fff3cd}
.subdomain-tag { background-color: #e2dcfc; } .family-tag { background-color: #d2f4ea; }
.web-links-section { font-size: 0.85em; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; }
.web-links-section .game-link { margin-right: 8px; }
.web-links-section .game-link:not(:last-child):after { content: "|"; margin-left: 5px; color: #aaa; text-decoration: none; }
/* Other styles as before */
</style>
