<template>
  <div class="game-list-container">
    <h2>My Board Games ({{ filteredGames.length }} / {{ boardGameStore.games.length }})</h2>
    <div class="controls">
      <button @click="fetchGamesWithLoading" :disabled="boardGameStore.loading" class="refresh-btn">
        {{ boardGameStore.loading && initialLoad ? "Refreshing..." : "Refresh Games" }}
      </button>
      <div class="filter-status"><label for="statusFilter">Filter by Status:</label>
        <select id="statusFilter" v-model="selectedStatus">
          <option value="">All Statuses</option>
          <option v-for="sOpt in statusFilterOptions" :key="sOpt" :value="sOpt">{{ sOpt }}</option>
        </select>
      </div>
    </div>

    <div v-if="boardGameStore.loading && initialLoad">Loading games...</div>
    <div v-else-if="boardGameStore.error && !boardGameStore.loading" class="error">Error: {{ boardGameStore.error }}</div>

    <ul v-else-if="filteredGames.length > 0" class="game-list">
      <li v-for="game in filteredGames" :key="game.id" class="game-item" :class="[{ 'is-expansion-item': game.isExpansion }, statusClass(game.status)]">
        <div class="game-thumbnail" v-if="game.thumbnailUrl">
          <img :src="game.thumbnailUrl" :alt="game.name + ` thumbnail`" />
        </div>
        <div class="game-info">
          <h3>{{ game.name }} <span v-if="game.isExpansion" class="expansion-tag">[Exp]</span></h3>

          <p v-if="game.isExpansion && game.baseGameAppId" class="base-game-link">Expansion for: <strong>{{ getBaseGameName(game.baseGameAppId) || "Unknown Base Game" }}</strong></p>
          <p v-else-if="game.isExpansion && game.bggBaseGameId" class="base-game-link">Expansion for BGG ID: {{game.bggBaseGameId}} (not in collection or not linked)</p>

          <p v-if="game.yearPublished" class="game-meta">Year: {{ game.yearPublished }} <span v-if="game.version && game.version !== game.yearPublished.toString()">| Version: {{ game.version }}</span></p>
          <p v-if="game.status" class="game-meta status-tag" :class="statusClass(game.status)">Status: <strong>{{ game.status }}</strong></p>

          <div v-if="game.crowdfundingPlatform || game.crowdfundingUrl || game.crowdfundingStatus" class="crowdfunding-info game-meta">
            📦 <strong>Crowdfunded:</strong>
            <span v-if="game.crowdfundingPlatform"> {{ game.crowdfundingPlatform }}</span>
            <span v-if="game.crowdfundingStatus"> ({{ game.crowdfundingStatus }})</span>
            <a v-if="game.crowdfundingUrl" :href="game.crowdfundingUrl" target="_blank" rel="noopener noreferrer" class="game-link"> Project Link</a>
          </div>

          <div v-if="game.locationRoom || game.locationCupboard || game.locationShelf || game.locationNotes" class="location-info game-meta">
            📍 <strong>Location:</strong>
            <template v-if="game.locationRoom">{{ game.locationRoom }}</template>
            <template v-if="game.locationCupboard"><span v-if="game.locationRoom"> &gt; </span>{{ game.locationCupboard }}</template>
            <template v-if="game.locationShelf"><span v-if="game.locationRoom || game.locationCupboard"> &gt; </span>Shelf {{ game.locationShelf }}</template>
            <template v-if="game.locationNotes"> ({{ game.locationNotes }})</template>
          </div>

          <div class="game-tags">
            <span v-if="game.designers && game.designers.length > 0" class="tag designers-tag" :title="game.designers.join(', ')">🧑‍🎨 {{ game.designers.slice(0,2).join(", ") }}<span v-if="game.designers.length > 2">...</span></span>
            <span v-if="game.publishers && game.publishers.length > 0" class="tag publishers-tag" :title="game.publishers.join(', ')">🏢 {{ game.publishers.slice(0,1).join(", ") }}<span v-if="game.publishers.length > 1">...</span></span>
            <span v-if="game.categories && game.categories.length > 0" class="tag category-tag" :title="game.categories.join(', ')">{{ game.categories.slice(0,2).join(", ") }}<span v-if="game.categories.length > 2">...</span></span>
            <span v-if="game.mechanics && game.mechanics.length > 0" class="tag mechanic-tag" :title="game.mechanics.join(', ')">{{ game.mechanics.slice(0,2).join(", ") }}<span v-if="game.mechanics.length > 2">...</span></span>
            <span v-if="game.bggSubdomains && game.bggSubdomains.length > 0" class="tag subdomain-tag" :title="game.bggSubdomains.join(', ')">🌐 {{ game.bggSubdomains[0] }}<span v-if="game.bggSubdomains.length > 1">...</span></span>
            <span v-if="game.bggFamilies && game.bggFamilies.length > 0" class="tag family-tag" :title="game.bggFamilies.join(', ')">👪 {{ game.bggFamilies[0] }}<span v-if="game.bggFamilies.length > 1">...</span></span>
          </div>
          <p class="game-description">{{ game.description }}</p>
          <div class="game-stats">
            <span v-if="game.bggRating" title="BGG Rating">⭐ {{ game.bggRating?.toFixed(1) }}/10</span>
            <span v-if="game.bggComplexity" title="BGG Complexity (Weight)">⚖️ {{ game.bggComplexity?.toFixed(2) }}</span>
            <span v-if="game.minPlayers && game.maxPlayers" title="Players">👥 {{ game.minPlayers }}-{{ game.maxPlayers }}</span>
            <span v-if="game.playingTime" title="Playing Time">⏱️ {{ game.playingTime }} min</span>
          </div>

          <div class="web-links-section game-meta" v-if="game.officialWebsiteUrl || game.manualUrl || (game.otherLinks && game.otherLinks.length > 0)">
            <h4 class="links-header">🔗 Links</h4>
            <ul class="links-list">
              <li v-if="game.officialWebsiteUrl"><a :href="game.officialWebsiteUrl" target="_blank" rel="noopener noreferrer" class="game-link">Official Website</a></li>
              <li v-if="game.manualUrl"><a :href="game.manualUrl" target="_blank" rel="noopener noreferrer" class="game-link">Manual</a></li>
              <li v-for="(link, idx) in game.otherLinks" :key="idx">
                <a :href="link.url" target="_blank" rel="noopener noreferrer" class="game-link">{{ link.title || "Link" }}</a>
              </li>
            </ul>
          </div>

          <div class="play-stats-section">
            <h4>Plays ({{ getPlayCount(game) }}) <span v-if="getLastPlayedDate(game)">- Last: {{ formatDate(getLastPlayedDate(game)) }}</span></h4>
            <button @click="openLogPlayModal(game)" class="log-play-btn-main">Log New Play</button>

            <div v-if="game.plays && game.plays.length > 0" class="past-plays-list">
              <h5>Past Plays:</h5>
              <ul>
                <li v-for="play in game.plays" :key="play.id" class="play-session-item">
                  <span><strong>Date:</strong> {{ formatDate(play.date) }}</span>
                  <span v-if="play.playerNames && play.playerNames.length"><strong>Players:</strong> {{ play.playerNames.join(", ") }}</span>
                  <p v-if="play.notes"><em>Notes:</em> {{ play.notes }}</p>
                  <button @click="confirmDeletePlay(game.id, play.id)" class="delete-play-btn" title="Delete this play session">🗑️</button>
                </li>
              </ul>
            </div>
          </div>

           <p v-if="game.bggId" class="game-meta bgg-link">
            <a :href="`https://boardgamegeek.com/boardgame/${game.bggId}`" target="_blank" rel="noopener noreferrer">View on BGG (ID: {{ game.bggId }})</a>
          </p>
          <div v-if="game.bggExpansionIds && game.bggExpansionIds.length > 0" class="expansions-list">
            <strong>Expansions (BGG):</strong>
            <ul><li v-for="expId in game.bggExpansionIds" :key="expId">BGG ID: {{ expId }} - {{ getExpansionNameFromCollection(expId) || "(Not in collection)"}}</li></ul>
          </div>
        </div>
      </li>
    </ul>
    <p v-else-if="boardGameStore.games.length > 0 && filteredGames.length === 0">No games match the current filter.</p>
    <p v-else>No games in your collection yet. Add some!</p>

    <!-- Log Play Modal -->
    <div v-if="showLogPlayModal && currentGameForPlayLog" class="modal-overlay">
      <div class="modal-content">
        <h3>Log Play for: {{ currentGameForPlayLog.name }}</h3>
        <div><label for="playDate">Date:</label><input type="date" id="playDate" v-model="playLogForm.date" /></div>
        <div><label for="playerNames">Player Names (comma-separated):</label><input type="text" id="playerNames" v-model="playLogForm.playerNamesString" /></div>
        <div><label for="playNotes">Notes (Optional):</label><textarea id="playNotes" v-model="playLogForm.notes" rows="3"></textarea></div>
        <div class="modal-actions">
          <button @click="submitLogPlay" :disabled="playLogSubmitLoading" class="modal-button-submit">
            {{ playLogSubmitLoading ? "Saving..." : "Save Play" }}
          </button>
          <button @click="closeLogPlayModal" class="modal-button-cancel">Cancel</button>
        </div>
        <p v-if="playLogError" class="error">{{ playLogError }}</p>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, reactive, computed } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";
import type { BoardGame, PlaySession } from "../types";

const boardGameStore = useBoardGameStore();
const initialLoad = ref(true);
const selectedStatus = ref("");
const statusFilterOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);
const availableStatuses = statusFilterOptions; // Alias for template consistency

// Log Play Modal State
const showLogPlayModal = ref(false);
const currentGameForPlayLog = ref<BoardGame | null>(null);
const playLogForm = reactive({ date: new Date().toISOString().split("T")[0], playerNamesString: "", notes: "" });
const playLogSubmitLoading = ref(false);
const playLogError = ref<string | null>(null);

const fetchGamesWithLoading=async()=>{initialLoad.value=true;await boardGameStore.fetchGames();initialLoad.value=false;};
onMounted(async()=>{if(boardGameStore.games.length===0){initialLoad.value=true;await boardGameStore.fetchGames();initialLoad.value=false;}else{initialLoad.value=false;}});
const formatDate=(ds?:string)=>ds?new Date(ds).toLocaleDateString():"";

const filteredGames=computed(()=>boardGameStore.games.filter(g=>!selectedStatus.value||g.status===selectedStatus.value));
const getBaseGameName=(id:string)=>boardGameStore.games.find(g=>g.id===id)?.name;
const getExpansionNameFromCollection=(id:number)=>boardGameStore.games.find(g=>g.bggId===id&&g.isExpansion)?.name;
const statusClass = (status?: string): string => {
  if (!status) return "";
  return `status-${status.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
};

// Computed helpers for play stats
const getPlayCount = (game: BoardGame) => game.plays?.length || 0;
const getLastPlayedDate = (game: BoardGame): string | undefined => {
  if (!game.plays || game.plays.length === 0) return undefined;
  return game.plays[0].date; // Assumes plays are sorted newest first
};

const openLogPlayModal = (game: BoardGame) => {
  currentGameForPlayLog.value = game;
  playLogForm.date = new Date().toISOString().split("T")[0];
  playLogForm.playerNamesString = "";
  playLogForm.notes = "";
  playLogError.value = null;
  showLogPlayModal.value = true;
};
const closeLogPlayModal = () => { showLogPlayModal.value = false; currentGameForPlayLog.value = null; };

const submitLogPlay = async () => {
  if (!currentGameForPlayLog.value) return;
  playLogSubmitLoading.value = true;
  playLogError.value = null;
  const playData: Omit<PlaySession, "id"> = {
    date: playLogForm.date,
    playerNames: playLogForm.playerNamesString.split(",").map(s => s.trim()).filter(s => s),
    notes: playLogForm.notes
  };
  const success = await boardGameStore.addPlaySession(currentGameForPlayLog.value.id, playData);
  if (success) {
    closeLogPlayModal();
  } else {
    playLogError.value = boardGameStore.error || "Failed to save play session.";
  }
  playLogSubmitLoading.value = false;
};

const confirmDeletePlay = async (gameId: string, playId: string) => {
  if (window.confirm("Are you sure you want to delete this play session?")) {
    const success = await boardGameStore.deletePlaySession(gameId, playId);
    if (!success) {
      alert(boardGameStore.error || "Failed to delete play session.");
    }
  }
};
</script>
<style scoped>
.game-list-container{padding:10px;background-color:#fff;border-radius:5px}
.controls{margin-bottom:15px;display:flex;gap:15px;align-items:center;flex-wrap:wrap}
.status-tag strong{display:inline-block;padding:3px 8px;color:#fff;border-radius:10px;font-size:.85em; line-height: 1.2;}
.status-owned strong { background-color: #28a745; }
.status-being-shipped strong { background-color: #17a2b8; }
.status-preordered strong { background-color: #17a2b8; }
.status-backed-on-crowdfunding strong { background-color: #fd7e14; }
.status-wishlist strong { background-color: #ffc107; color: #212529;}
.status-data-tracking-only strong { background-color: #6c757d; }
.status-sold strong { background-color: #dc3545; }
.status-played strong { background-color: #007bff; }
.status-unopened strong { background-color: #343a40; }
.status-shrink-wrapped strong { background-color: #495057; }
.crowdfunding-info { background-color: #fff3cd; border-left: 3px solid #ffeeba; padding: 5px 8px; margin-top: 5px; font-size: 0.85em; }
.web-links-section ul.links-list { list-style-type: none; padding-left: 0; margin-left: 0; }
.web-links-section li { display: inline; margin-right: 5px; }
.web-links-section li:not(:last-child):after { content: "|"; margin-left: 5px; color: #ccc; text-decoration:none; }
.game-item{display:flex;gap:15px;padding:15px;margin-bottom:15px;border:1px solid #eee;border-radius:4px}
.location-info{background-color:#fafad2;padding:3px 6px;border-radius:3px;margin-top:5px}
.game-tags{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0;font-size:.8em}
.tag{padding:2px 6px;border-radius:3px;background-color:#f0f0f0;color:#333}
.designers-tag{background-color:#cfe2ff} .publishers-tag{background-color:#d1e7dd}
.subdomain-tag { background-color: #e2dcfc; } .family-tag { background-color: #d2f4ea; }
.play-stats-section { margin-top:10px; padding-top:10px; border-top:1px dashed #eee; }
.play-stats-section h4 { margin:0 0 5px 0; font-size: 1em; }
.log-play-btn-main { padding:5px 10px; font-size:0.9em; background-color:#5cb85c; color:white; border:none; border-radius:3px; cursor:pointer; margin-bottom:10px; }
.past-plays-list { margin-top:10px; font-size:0.9em; }
.past-plays-list h5 { margin:0 0 5px 0; font-size:1em; }
.past-plays-list ul { list-style:none; padding-left:0; }
.play-session-item { background-color:#f9f9f9; border:1px solid #efefef; padding:8px; margin-bottom:5px; border-radius:3px; }
.play-session-item span { margin-right:10px; }
.play-session-item p { margin:5px 0 0 0; font-size:0.95em; }
.delete-play-btn { float:right; padding:2px 5px; font-size:0.8em; background-color:#d9534f; color:white; border:none; border-radius:3px; cursor:pointer; }
.modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000; }
.modal-content { background-color:white; padding:20px; border-radius:5px; box-shadow:0 2px 10px rgba(0,0,0,0.1); width:90%; max-width:500px; }
.modal-content h3 { margin-top:0; }
.modal-content div { margin-bottom:10px; }
.modal-content label { display:block; margin-bottom:5px; }
.modal-content input[type="date"], .modal-content input[type="text"], .modal-content textarea { width:100%; padding:8px; box-sizing:border-box; border:1px solid #ccc; border-radius:3px; }
.modal-actions { margin-top:15px; text-align:right; }
.modal-actions button { padding:8px 15px; margin-left:10px; border-radius:3px; border:none; cursor:pointer; }
.modal-button-submit { background-color:#007bff; color:white; }
.modal-button-cancel { background-color:#6c757d; color:white; }
.error { color: red; }
</style>
