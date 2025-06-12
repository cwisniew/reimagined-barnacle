<template>
  <div class="game-detail-view" v-if="game">
    <div class="detail-header">
      <h1>{{ game.name }} <span v-if="game.isExpansion" class="expansion-tag-detail">[Expansion]</span></h1>
      <div class="detail-actions">
        <button @click="goBack" class="action-btn back-btn">Back to List</button>
        <button @click="editThisGame" class="action-btn edit-btn">Edit</button>
        <button @click="confirmDeleteThisGame" class="action-btn delete-btn">Delete</button>
      </div>
    </div>

    <div v-if="game.isExpansion && game.baseGameAppId" class="detail-section base-game-link-detail">
      <p><strong>Expansion for:</strong> {{ getBaseGameNameFromStore(game.baseGameAppId) || "ID: " + game.baseGameAppId }}</p>
    </div>
     <div v-else-if="game.isExpansion && game.bggBaseGameId" class="detail-section base-game-link-detail">
       <p><strong>Expansion for BGG ID:</strong> <a :href="`https://boardgamegeek.com/boardgame/${game.bggBaseGameId}`" target="_blank">{{ game.bggBaseGameId }}</a> (Base game not in local collection or not linked)</p>
    </div>

    <div class="detail-grid">
      <div class="main-details">
        <!-- User Uploaded Images Gallery / Main Image -->
        <div v-if="game.userImageUrls && game.userImageUrls.length > 0" class="user-image-gallery-detail">
          <img :src="game.userImageUrls[0]" :alt="game.name + ` user image 1`" class="game-image-detail primary-user-image"/>
          <div v-if="game.userImageUrls.length > 1" class="additional-user-images">
            <img v-for="(url, index) in game.userImageUrls.slice(1)" :key="index" :src="url" :alt="game.name + ` user image ` + (index + 2)" class="additional-user-image-thumb"/>
          </div>
        </div>
        <!-- Fallback to BGG image if no user images -->
        <img v-else-if="game.imageUrl || game.thumbnailUrl" :src="game.imageUrl || game.thumbnailUrl" :alt="game.name + ` image`" class="game-image-detail bgg-image"/>

        <p class="description-detail" v-html="formattedDescription"></p>

        <section class="detail-section card-sets-detail" v-if="game.cardSets && game.cardSets.length > 0">
          <h3>Card Sleeve Inventory</h3>
          <ul class="card-set-details-list">
            <li v-for="cs in game.cardSets" :key="cs.id">
              <strong>{{cs.categoryName}}</strong> ({{cs.cardCount}} cards): {{cs.sleevedCount || 0}} / {{cs.cardCount}} sleeved ({{sleeveSetCompletion(cs)}}%).
              <span v-if="cs.cardSize"> Size: {{cs.cardSize}}.</span>
              <span v-if="cs.sleeveNotes"> Notes: {{cs.sleeveNotes}}</span>
            </li>
          </ul>
           <p><strong>Overall:</strong> {{ totalSleevedCardsInGame(game) }} / {{ totalCardsInGame(game) }} cards sleeved ({{ overallSleeveCompletionPercentage(game) }}%)</p>
        </section>

        <section class="detail-section links-detail" v-if="game.officialWebsiteUrl || (game.otherLinks && game.otherLinks.length > 0) || game.manualUrl">
          <h3>Links</h3>
          <ul class="links-list">
            <li v-if="game.officialWebsiteUrl"><a :href="game.officialWebsiteUrl" target="_blank" rel="noopener noreferrer">Official Website</a></li>
            <li v-if="game.manualUrl"><a :href="game.manualUrl" target="_blank" rel="noopener noreferrer">Game Manual</a></li>
            <li v-for="(link, i) in game.otherLinks" :key="`otherlink-${i}`"><a :href="link.url" target="_blank" rel="noopener noreferrer">{{link.title}}</a></li>
          </ul>
        </section>

        <section class="detail-section plays-detail">
          <h3>Play Sessions ({{ game.plays?.length || 0 }})</h3>
          <button @click="openPlayLogModalForGame(game)" class="log-play-btn-detail-view">Log New Play for This Game</button>
          <ul v-if="game.plays && game.plays.length > 0" class="play-session-detail-list">
            <li v-for="play in game.plays" :key="play.id" class="play-session-detail-item">
              <div class="play-session-header">
                <strong>{{ formatDate(play.date) }}</strong>
                <button @click="confirmDeletePlaySession(game.id, play.id)" class="delete-play-btn-detail" title="Delete this play">🗑️</button>
              </div>
              <div v-if="play.playersInSession && play.playersInSession.length > 0" class="play-players-list">
                <strong>Players:</strong>
                <ul>
                  <li v-for="player in play.playersInSession" :key="player.id">
                    {{ player.name }}
                    <span v-if="player.enjoyment !== undefined"> (Enjoyment: {{ player.enjoyment }}/5)</span>
                    <span v-if="player.won" class="won-tag">🏆 Won!</span>
                    <em v-if="player.notes"> - Notes: {{ player.notes }}</em>
                  </li>
                </ul>
              </div>
              <p v-if="play.notes" class="overall-session-notes"><strong>Overall Session Notes:</strong> {{ play.notes }}</p>
            </li>
          </ul>
          <p v-else>No play sessions logged yet for this game.</p>
        </section>
      </div>

      <aside class="sidebar-details">
        <section class="detail-section">
          <h3>Game Information</h3>
          <p><strong>Status:</strong> <span :class="statusClass(game.status)" class="status-tag-detail">{{ game.status || "N/A" }}</span></p>
          <p v-if="game.version"><strong>Version:</strong> {{ game.version }}</p>
          <p v-if="game.yearPublished"><strong>Year Published:</strong> {{ game.yearPublished }}</p>
          <p v-if="game.minPlayers && game.maxPlayers"><strong>Players:</strong> {{ game.minPlayers }} - {{ game.maxPlayers }}</p>
          <p v-if="game.playingTime"><strong>Playing Time:</strong> {{ game.playingTime }} min</p>
        </section>

        <section class="detail-section" v-if="game.bggId">
          <h3>BGG Information</h3>
          <p><strong>BGG ID:</strong> <a :href="`https://boardgamegeek.com/boardgame/${game.bggId}`" target="_blank">{{ game.bggId }}</a></p>
          <p v-if="game.bggRating"><strong>BGG Rating:</strong> {{ game.bggRating?.toFixed(1) }}/10</p>
          <p v-if="game.bggComplexity"><strong>BGG Complexity:</strong> {{ game.bggComplexity?.toFixed(2) }}/5</p>
        </section>

        <section class="detail-section tags-section" v-if="hasTags">
          <h3>Tags & Classifications</h3>
          <div class="tag-group" v-if="game.designers && game.designers.length"><p><strong>Designers:</strong> <span v-for="(d,i) in game.designers" :key="`d-${i}`" class="tag-item designer">{{d}}</span></p></div>
          <div class="tag-group" v-if="game.publishers && game.publishers.length"><p><strong>Publishers:</strong> <span v-for="(p,i) in game.publishers" :key="`p-${i}`" class="tag-item publisher">{{p}}</span></p></div>
          <div class="tag-group" v-if="game.categories && game.categories.length"><p><strong>Categories:</strong> <span v-for="(c,i) in game.categories" :key="`c-${i}`" class="tag-item category">{{c}}</span></p></div>
          <div class="tag-group" v-if="game.mechanics && game.mechanics.length"><p><strong>Mechanics:</strong> <span v-for="(m,i) in game.mechanics" :key="`m-${i}`" class="tag-item mechanic">{{m}}</span></p></div>
          <div class="tag-group" v-if="game.bggSubdomains && game.bggSubdomains.length"><p><strong>Subdomains:</strong> <span v-for="(s,i) in game.bggSubdomains" :key="`sd-${i}`" class="tag-item subdomain">{{s}}</span></p></div>
          <div class="tag-group" v-if="game.bggFamilies && game.bggFamilies.length"><p><strong>Families:</strong> <span v-for="(f,i) in game.bggFamilies" :key="`fam-${i}`" class="tag-item family">{{f}}</span></p></div>
        </section>

        <section class="detail-section" v-if="game.locationRoom || game.locationCupboard || game.locationShelf || game.locationNotes">
            <h3>Storage Location</h3>
            <p v-if="game.locationRoom"><strong>Room:</strong> {{game.locationRoom}}</p>
            <p v-if="game.locationCupboard"><strong>Cupboard/Area:</strong> {{game.locationCupboard}}</p>
            <p v-if="game.locationShelf"><strong>Shelf:</strong> {{game.locationShelf}}</p>
            <p v-if="game.locationNotes"><strong>Notes:</strong> {{game.locationNotes}}</p>
        </section>

        <section class="detail-section" v-if="game.crowdfundingPlatform || game.crowdfundingUrl || game.crowdfundingStatus">
            <h3>Crowdfunding</h3>
            <p v-if="game.crowdfundingPlatform"><strong>Platform:</strong> {{game.crowdfundingPlatform}}</p>
            <p v-if="game.crowdfundingUrl"><strong>URL:</strong> <a :href="game.crowdfundingUrl" target="_blank">{{game.crowdfundingUrl}}</a></p>
            <p v-if="game.crowdfundingStatus"><strong>Status:</strong> {{game.crowdfundingStatus}}</p>
        </section>

        <div v-if="game.bggExpansionIds && game.bggExpansionIds.length > 0" class="detail-section expansions-detail-list">
            <h3>Expansions (from BGG)</h3>
            <ul>
                <li v-for="expId in game.bggExpansionIds" :key="expId">
                    BGG ID: {{ expId }} - {{ getExpansionNameFromStore(expId) || "(Not in local collection or unlinked)" }}
                </li>
            </ul>
        </div>
      </aside>
    </div>
  </div>
  <div v-else-if="loading"><p>Loading game details...</p></div>
  <div v-else-if="error"><p class="error">Error: {{ error }}</p><button @click="goBack">Back</button></div>
  <div v-else><p>Game not found.</p><button @click="goBack">Back</button></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBoardGameStore } from "../stores/boardGameStore";
import { useEditGameStore } from "../stores/editGameStore";
import type { BoardGame, CardSet, PlaySession } from "../types";

const route = useRoute(); const router = useRouter();
const boardGameStore = useBoardGameStore(); const editGameStore = useEditGameStore();
const game = ref<BoardGame | null>(null);
const loading = ref(false); const error = ref<string | null>(null);
const gameId = ref(route.params.id as string);

async function fetchGame(id: string) {
  loading.value = true; error.value = null;
  try {
    const existingGame = boardGameStore.games.find(g => g.id === id);
    if (existingGame && boardGameStore.games.length > 0) {
      game.value = JSON.parse(JSON.stringify(existingGame));
    } else {
      const response = await fetch(`/api/boardgames/${id}`);
      if (!response.ok) { if(response.status === 404) throw new Error("Game not found (404)."); throw new Error(`Fetch failed: ${response.statusText}`);}
      const fetchedGame = await response.json() as BoardGame;
      game.value = fetchedGame;
    }
  } catch (e:any) {error.value = e.message;} finally {loading.value = false;}
}
onMounted(()=>fetchGame(gameId.value));
watch(()=>route.params.id, (newId)=>{if(newId && typeof newId === "string" && newId !== gameId.value){gameId.value=newId; fetchGame(newId);}});

const goBack = () => router.push("/");
const editThisGame = () => { if(game.value){ editGameStore.setGameToEdit(game.value); router.push("/");}};
const confirmDeleteThisGame = async () => { if(game.value && window.confirm(`Delete "${game.value.name}"?`)){const success = await boardGameStore.deleteGame(game.value.id); if(success) router.push("/"); else alert(boardGameStore.error || "Delete failed");}};
const formatDate = (ds?:string) => ds ? new Date(ds).toLocaleDateString() : "";
const statusClass = (s?:string) => s ? `status-${s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}` : "";
const getBaseGameNameFromStore = (appId?: string) => appId ? boardGameStore.games.find(g=>g.id===appId)?.name : "";
const getExpansionNameFromStore = (bggId?: number) => bggId ? boardGameStore.games.find(g=>g.bggId===bggId && g.isExpansion)?.name : "";

const formattedDescription = computed(() => {
  return game.value?.description?.replace(/\\n/g, "<br />").replace(/\n/g, "<br />") || "";
});
const hasTags = computed(() => game.value && ((game.value.designers?.length || 0) > 0 || (game.value.publishers?.length || 0) > 0 || (game.value.categories?.length || 0) > 0 || (game.value.mechanics?.length || 0) > 0 || (game.value.bggSubdomains?.length || 0) > 0 || (game.value.bggFamilies?.length || 0) > 0));

const totalCardsInGame = (g: BoardGame) => g.cardSets?.reduce((sum, set) => sum + (set.cardCount || 0), 0) || 0;
const totalSleevedCardsInGame = (g: BoardGame) => g.cardSets?.reduce((sum, set) => sum + (set.sleevedCount || 0), 0) || 0;
const overallSleeveCompletionPercentage = (g: BoardGame) => {
  const total = totalCardsInGame(g);
  return total === 0 ? "0" : ((totalSleevedCardsInGame(g) / total) * 100).toFixed(0);
};
const sleeveSetCompletion = (cs: CardSet) => cs.cardCount === 0 ? "0" : (((cs.sleevedCount || 0) / cs.cardCount) * 100).toFixed(0);

const openPlayLogModalForGame = (gameToLog: BoardGame) => {
  alert(`To log a play for ${gameToLog.name}, please use the "Log Play" button on the main list page for now.`);
};
const confirmDeletePlaySession = async (gameId: string, playId: string) => {
  if (window.confirm("Are you sure you want to delete this play session?")) {
    const success = await boardGameStore.deletePlaySession(gameId, playId);
    if (!success) {
      alert(boardGameStore.error || "Failed to delete play session.");
    } else {
      if(game.value) fetchGame(game.value.id);
    }
  }
};
</script>

<style scoped>
.game-detail-view { padding: 20px; max-width: 900px; margin: auto; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.detail-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
.detail-header h1 { margin:0; font-size: 2em; color: #333; }
.expansion-tag-detail { font-size: 0.7em; color: #17a2b8; font-weight: bold; margin-left: 8px; vertical-align: middle; }
.detail-actions { display: flex; gap: 10px; }
.action-btn { padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
.back-btn { background-color: #6c757d; color: white; }
.edit-btn { background-color: #ffc107; color: #212529; }
.delete-btn { background-color: #dc3545; color: white; }
.detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
.main-details .game-image-detail { width: 100%; max-height: 400px; object-fit: contain; border-radius: 5px; margin-bottom: 15px; border: 1px solid #eee;}
.user-image-gallery-detail .primary-user-image { /* Styles for the main displayed user image */ }
.additional-user-images { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
.additional-user-image-thumb { width: 80px; height: 80px; object-fit: cover; border-radius: 3px; border: 1px solid #ddd; cursor: pointer; }
.main-details .bgg-image { /* Specific styles if BGG image is shown as fallback */ }
.description-detail { line-height: 1.6; color: #444; white-space: pre-wrap; }
.sidebar-details .detail-section { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
.detail-section { margin-bottom: 20px; padding-bottom:15px; border-bottom:1px solid #f0f0f0; }
.detail-section:last-child { border-bottom: none; }
.detail-section h3 { margin-top:0; margin-bottom:12px; font-size:1.2em; color:#0056b3; }
.detail-section p, .detail-section div:not(.tag-group) { margin-bottom: 8px; font-size: 0.95em; }
.detail-section p strong { color: #333; margin-right: 5px; }
.links-list { list-style:none; padding:0; } .links-list li { margin-bottom: 5px; }
.links-list li a { text-decoration:underline; color:#007bff; }
.status-tag-detail { display:inline-block; padding:3px 10px; border-radius:12px; color:white; font-size:0.9em; font-weight:500;}
.tags-section .tag-group { margin-bottom: 8px; }
.tags-section .tag-group p strong { display: block; margin-bottom: 3px; }
.tag-item { display:inline-block; background-color:#e9ecef; color:#333; padding:3px 8px; border-radius:3px; margin-right:5px; margin-bottom:5px; font-size:0.9em; }
.card-set-detail-item { background-color:#f9f9f9; padding:8px; border:1px solid #eee; border-radius:3px; margin-bottom:5px; font-size:0.9em; }
.play-session-detail-list { list-style:none; padding:0; }
.play-session-detail-item { background-color:#f9f9f9; padding:10px; border:1px solid #e0e0e0; border-radius:4px; margin-bottom:10px; font-size:0.9em; }
.play-session-detail-item strong { color: #333; }
.play-session-detail-item ul { list-style: disc; margin-left: 20px; padding-left: 0; margin-top:5px; }
.play-session-detail-item ul li { margin-bottom: 3px; }
.play-session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.delete-play-btn-detail { padding: 3px 6px; font-size: 0.8em; background-color: #f2dede; color: #a94442; border: 1px solid #ebccd1; border-radius: 3px; cursor: pointer; }
.won-tag { background-color: #d4edda; color: #155724; padding: 2px 5px; border-radius: 3px; margin-left: 5px; font-size: 0.9em;}
.log-play-btn-detail-view { background-color: #5cb85c; color:white; padding: 8px 12px; border:none; border-radius:4px; cursor:pointer; margin-bottom:15px; font-size: 0.95em; }
.expansions-detail-list ul { list-style: disc; margin-left: 20px; }
.base-game-link-detail p { font-style: italic; color: #555; }
.error { color:red; }
</style>
