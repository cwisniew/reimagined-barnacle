<template>
  <div class="board-game-list-view">
    <div class="page-header">
      <h1>My Board Game Collection</h1>
      <button @click="editGameStore.enterAddMode()" v-if="!editGameStore.showForm" class="add-new-btn-page">
        + Add New Board Game
      </button>
    </div>

    <AddBoardGameForm v-if="editGameStore.showForm" />

    <div class="controls list-controls">
      <div class="filter-item">
        <label for="searchQueryInput">Search:</label>
        <input type="text" id="searchQueryInput" v-model="searchQuery" placeholder="Name/description..." />
      </div>
      <div class="filter-item">
        <label for="statusFilter">Status:</label>
        <select id="statusFilter" v-model="selectedStatus">
          <option value="">All</option>
          <option v-for="statusItem in statusFilterOptions" :key="statusItem" :value="statusItem">{{ statusItem }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label for="numPlayersFilter">Players:</label>
        <input type="number" id="numPlayersFilter" v-model.number="filterNumPlayers" placeholder="Any" min="1" class="num-players-input"/>
      </div>
      <div class="filter-item">
        <label for="expansionFilter">Type:</label>
        <select id="expansionFilter" v-model="filterExpansionStatus">
          <option value="all">All Types</option>
          <option value="base">Base Games Only</option>
          <option value="expansion">Expansions Only</option>
        </select>
      </div>

      <!-- New Sorting Controls -->
      <div class="filter-item">
        <label for="sortBySelect">Sort By:</label>
        <select id="sortBySelect" v-model="sortBy">
          <option value="name">Name</option>
          <option value="bggRating">BGG Rating</option>
          <option value="bggComplexity">BGG Complexity</option>
          <option value="yearPublished">Year Published</option>
          <option value="lastPlayedDate">Last Played</option>
          <option value="playCount">Play Count</option>
        </select>
      </div>
      <div class="filter-item">
        <button @click="toggleSortDirection" class="sort-direction-btn">
          Sort: {{ sortDirection === "asc" ? "Ascending" : "Descending" }} ({{ sortDirectionSymbol }})
        </button>
      </div>
      <div class="filter-item">
        <span>Displaying {{ processedGames.length }} of {{ boardGameStore.games.length }} games</span>
      </div>
    </div>

    <div v-if="boardGameStore.loading && initialLoad" class="loading-indicator">Loading games...</div>
    <div v-else-if="boardGameStore.error && !boardGameStore.loading" class="error-message">
      Error fetching games: {{ boardGameStore.error }} <button @click="fetchGamesWithLoading" class="refresh-btn">Refresh</button>
    </div>

    <ul v-else-if="processedGames.length > 0" class="game-list">
       <li v-for="game in processedGames" :key="game.id" class="game-item" :class="[{ 'is-expansion-item': game.isExpansion }, statusClass(game.status)]">
        <div class="game-thumbnail" v-if="game.thumbnailUrl">
          <router-link :to="{ name: 'GameDetail', params: { id: game.id } }"><img :src="game.thumbnailUrl" :alt="game.name + ` thumbnail`" /></router-link>
        </div>
        <div class="game-info">
          <h3><router-link :to="{ name: 'GameDetail', params: { id: game.id } }">{{ game.name }}</router-link>
            <span v-if="game.isExpansion" class="expansion-tag">[Exp]</span></h3>
          <p v-if="game.status" class="game-meta status-tag" :class="statusClass(game.status)">{{ game.status }}</p>
          <p class="game-meta" v-if="game.yearPublished">Year: {{ game.yearPublished }}</p>
          <p class="game-description short-description">{{ game.description }}</p>
           <div class="play-stats-summary game-meta">
             Plays: {{ getPlayCount(game) }} <span v-if="getLastPlayedDate(game)">| Last: {{ formatDate(getLastPlayedDate(game)) }}</span>
             <button @click="openLogPlayModal(game)" class="log-play-btn-listitem">Log Play</button>
          </div>
          <div class="game-actions">
            <button @click="handleEditGame(game)" class="edit-btn-list">Edit</button>
            <button @click="handleDeleteGame(game.id)" class="delete-btn-list">Delete</button>
          </div>
        </div>
      </li>
    </ul>
    <p v-else-if="boardGameStore.games.length > 0 && processedGames.length === 0" class="no-games-message">No games match filters/sort.</p>
    <p v-else class="no-games-message">Collection is empty.</p>

    <div v-if="showLogPlayModal && currentGameForPlayLog" class="modal-overlay">
      <div class="modal-content">
        <h3>Log Play for: {{ currentGameForPlayLog.name }}</h3>
        <div><label for="playDate">Date:</label><input type="date" id="playDate" v-model="playLogForm.date" /></div>
        <h4>Players & Details:</h4>
        <div v-for="(player, index) in playLogForm.playersInSession" :key="player.id" class="player-in-session-item">
          <input type="text" v-model="player.name" placeholder="Player Name" required class="player-name-input"/>
          <select v-model.number="player.enjoyment" class="player-enjoyment-select">
            <option :value="undefined">Enjoyment?</option><option value="5">5 (Loved it)</option><option value="4">4</option><option value="3">3 (Ok)</option><option value="2">2</option><option value="1">1 (Hated it)</option>
          </select>
          <label class="checkbox-label"><input type="checkbox" v-model="player.won" /> Won?</label>
          <input type="text" v-model="player.notes" placeholder="Player notes (e.g., score, faction)" class="player-notes-input"/>
          <button type="button" @click="removePlayerFromPlayLog(index)" class="remove-player-btn" title="Remove Player">X</button>
        </div>
        <button type="button" @click="addPlayerToPlayLog" class="add-player-btn">Add Player</button>
        <div><label for="playNotes">Overall Session Notes:</label><textarea id="playNotes" v-model="playLogForm.notes" rows="2"></textarea></div>
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
import { v4 as uuidv4 } from "uuid";
import { useBoardGameStore } from "../stores/boardGameStore";
import { useEditGameStore } from "../stores/editGameStore";
import AddBoardGameForm from "./AddBoardGameForm.vue";
import type { BoardGame, PlaySession, PlayerInPlaySession } from "../types";

const boardGameStore = useBoardGameStore();
const editGameStore = useEditGameStore();
const initialLoad = ref(true);
const selectedStatus = ref("");
const statusFilterOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);
const searchQuery = ref("");
const filterNumPlayers = ref<number | null>(null);
const filterExpansionStatus = ref("all");

// New refs for sorting
const sortBy = ref("name");
const sortDirection = ref<"asc" | "desc">("asc");

const showLogPlayModal = ref(false);
const currentGameForPlayLog = ref<BoardGame | null>(null);
const initialPlayLogFormState = () => ({ date: new Date().toISOString().split("T")[0], playersInSession: [] as PlayerInPlaySession[], notes: "" });
const playLogForm = reactive(initialPlayLogFormState());
const playLogSubmitLoading = ref(false);
const playLogError = ref<string | null>(null);

const fetchGamesWithLoading = async () => { initialLoad.value = true; await boardGameStore.fetchGames(); initialLoad.value = false; };
onMounted(async () => { if (boardGameStore.games.length === 0) { await fetchGamesWithLoading(); } else { initialLoad.value = false; }});

const filteredGames = computed(() => {
  let games = boardGameStore.games;
  if (selectedStatus.value) { games = games.filter(g => g.status === selectedStatus.value); }
  if (searchQuery.value.trim() !== "") {
    const lq = searchQuery.value.toLowerCase(); games = games.filter(g=>(g.name.toLowerCase().includes(lq))||(g.description&&g.description.toLowerCase().includes(lq)));
  }
  if (filterNumPlayers.value && filterNumPlayers.value > 0) {
    games = games.filter(g=>g.minPlayers!==undefined&&g.maxPlayers!==undefined&&g.minPlayers<=filterNumPlayers.value!&&g.maxPlayers>=filterNumPlayers.value!);
  }
  if (filterExpansionStatus.value === "base") { games = games.filter(g => !g.isExpansion); }
  else if (filterExpansionStatus.value === "expansion") { games = games.filter(g => g.isExpansion === true); }
  return games;
});

const processedGames = computed(() => {
  const gamesToSort = [...filteredGames.value];

  gamesToSort.sort((a, b) => {
    let valA: any;
    let valB: any;

    switch (sortBy.value) {
      case "bggRating":
      case "bggComplexity":
      case "yearPublished":
        valA = a[sortBy.value as keyof BoardGame] ?? (sortDirection.value === "asc" ? Infinity : -Infinity);
        valB = b[sortBy.value as keyof BoardGame] ?? (sortDirection.value === "asc" ? Infinity : -Infinity);
        break;
      case "lastPlayedDate":
        valA = a.plays && a.plays.length > 0 ? new Date(a.plays[0].date).getTime() : (sortDirection.value === "asc" ? Infinity : -Infinity);
        valB = b.plays && b.plays.length > 0 ? new Date(b.plays[0].date).getTime() : (sortDirection.value === "asc" ? Infinity : -Infinity);
        break;
      case "playCount":
        valA = a.plays?.length ?? 0;
        valB = b.plays?.length ?? 0;
        break;
      case "name":
      default:
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
    }

    if (valA < valB) return sortDirection.value === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection.value === "asc" ? 1 : -1;
    // If values are equal, maintain original relative order or sort by name as secondary for stability
    if (sortBy.value !== 'name') {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    }
    return 0;
  });
  return gamesToSort;
});

const sortDirectionSymbol = computed(() => sortDirection.value === "asc" ? "↑" : "↓");
const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

const handleEditGame = (game: BoardGame) => { editGameStore.setGameToEdit(game); if(document.querySelector('.add-game-form')){(document.querySelector('.add-game-form')as HTMLElement).scrollIntoView({behavior:'smooth'})}else{window.scrollTo({top:0,behavior:"smooth"})}};
const handleDeleteGame = async (gameId: string) => { if(window.confirm("Delete this game?")){const success = await boardGameStore.deleteGame(gameId); if(!success){alert(boardGameStore.error||"Delete failed")}else{if(editGameStore.gameToEdit&&editGameStore.gameToEdit.id===gameId)editGameStore.clearGameToEditAndHideForm();}}};
const statusClass = (s?:string) => s ? `status-${s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}` : "";
const formatDate=(ds?:string)=>ds?new Date(ds).toLocaleDateString():"";
const getPlayCount = (game: BoardGame) => game.plays?.length || 0;
const getLastPlayedDate = (game: BoardGame): string | undefined => { if (!game.plays || game.plays.length === 0) return undefined; return game.plays[0].date; };

const openLogPlayModal = (game: BoardGame) => { currentGameForPlayLog.value=game; Object.assign(playLogForm,initialPlayLogFormState()); addPlayerToPlayLog(); playLogError.value=null; showLogPlayModal.value=true; };
const closeLogPlayModal = () => { showLogPlayModal.value=false; currentGameForPlayLog.value=null; };
const addPlayerToPlayLog = () => { playLogForm.playersInSession.push({id:uuidv4(),name:"",enjoyment:undefined,won:false,notes:""}); };
const removePlayerFromPlayLog = (index:number) => { playLogForm.playersInSession.splice(index,1); };
const submitLogPlay = async () => { if(!currentGameForPlayLog.value)return; if(playLogForm.playersInSession.some(p=>!p.name.trim())){playLogError.value="Player name required.";return;} playLogSubmitLoading.value=true;playLogError.value=null; const playData:Omit<PlaySession,"id">={date:playLogForm.date,playersInSession:playLogForm.playersInSession.filter(p=>p.name.trim()),notes:playLogForm.notes}; const success=await boardGameStore.addPlaySession(currentGameForPlayLog.value.id,playData); if(success)closeLogPlayModal(); else playLogError.value=boardGameStore.error||"Save failed."; playLogSubmitLoading.value=false;};
</script>

<style scoped>
.board-game-list-view { padding: 10px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.add-new-btn-page { background-color: #007bff; color: white; padding: 10px 15px; border:none; border-radius:4px; font-size: 1em; cursor:pointer; }
.list-controls {
  margin-bottom: 20px;
  display:flex;
  gap:15px;
  align-items:center;
  background-color:#f8f9fa;
  padding:10px 15px;
  border-radius:4px;
  flex-wrap: wrap;
}
.filter-item { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; }
.filter-item label { font-size: 0.9em; margin-right: 5px; white-space: nowrap; }
.filter-item input[type="text"], .filter-item select, .filter-item input[type="number"] {
  padding: 6px 8px;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-size:0.9em;
}
.num-players-input { width: 80px; }
.sort-direction-btn { padding: 6px 10px; font-size: 0.9em; border-radius: 3px; cursor: pointer; background-color: #f0f0f0; border: 1px solid #ccc; }
.loading-indicator, .error-message, .no-games-message { text-align:center; padding: 20px; font-size: 1.1em; }
.game-list { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.game-item { display: flex; flex-direction: column; border: 1px solid #ddd; border-radius: 5px; background-color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; }
.is-expansion-item { border-left: 4px solid #17a2b8; }
.game-thumbnail { width:100%; height:180px; overflow:hidden; }
.game-thumbnail img { width:100%; height:100%; object-fit:cover; transition: transform 0.2s ease-in-out; }
.game-thumbnail img:hover { transform: scale(1.05); }
.game-info { padding: 15px; flex-grow: 1; display: flex; flex-direction: column; }
.game-info h3 { margin:0 0 8px 0; font-size:1.3em; }
.game-info h3 a { text-decoration:none; color: #333; }
.game-info h3 a:hover { color: #007bff; }
.expansion-tag { font-size:0.8em; color:#17a2b8; font-weight:bold; margin-left:5px; }
.game-meta { font-size:0.9em; color:#666; margin:4px 0; }
.status-tag { display:inline-block; padding:3px 8px; border-radius:10px; color:white; font-size:0.8em; margin-bottom:8px; }
.status-owned { background-color: #28a745 !important; }
.status-wishlist { background-color: #ffc107 !important; color: #212529 !important;}
.short-description { font-size:0.9em; color:#555; margin-bottom:10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; min-height: 54px; }
.play-stats-summary { font-size: 0.85em; color: #555; margin-top: 8px; padding-top: 8px; border-top: 1px solid #f0f0f0;}
.log-play-btn-listitem { font-size:0.85em; padding:4px 8px; margin-left:10px; background-color:#5cb85c; color:white; border:none; border-radius:3px; cursor:pointer;}
.game-actions { margin-top: auto; padding-top:10px; border-top:1px solid #eee; display:flex; gap:10px; }
.edit-btn-list, .delete-btn-list { padding: 6px 12px; font-size:0.9em; border-radius:3px; cursor:pointer; border:none; color:white; }
.edit-btn-list { background-color:#ffc107; color:#212529; }
.delete-btn-list { background-color:#dc3545; }
/* Modal styles */
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:1000}
.modal-content{background-color:white;padding:25px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.2);width:90%;max-width:600px}
.modal-content h3{margin-top:0;margin-bottom:20px;color:#333}
.modal-content > div {margin-bottom:15px;}
.modal-content label{display:block;margin-bottom:6px;font-weight:500;color:#444}
.modal-content input[type="date"], .modal-content input[type="text"], .modal-content textarea, .modal-content select {width:100%;padding:10px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;font-size:1em}
.player-in-session-item { border:1px solid #e0e0e0; padding:12px; margin-bottom:12px; border-radius:4px; background:#f9f9f9; }
.player-in-session-item .player-name-input { width: calc(50% - 5px); margin-right: 10px; display:inline-block; vertical-align: middle;}
.player-in-session-item .player-enjoyment-select { width: calc(30% - 5px); margin-right:10px; display:inline-block; vertical-align: middle;}
.player-in-session-item .checkbox-label { font-size:0.9em; margin-left:0; display:inline-flex; align-items:center; width:auto; vertical-align: middle; }
.player-in-session-item .checkbox-label input[type="checkbox"] { width:auto; margin-right:5px; }
.player-in-session-item .player-notes-input { margin-top:8px; font-size:0.95em; }
.remove-player-btn { background-color:#e74c3c; color:white; border:none; padding:4px 8px; font-size:0.8em; border-radius:3px; float:right; }
.add-player-btn { background-color:#3498db; color:white; border:none; padding:8px 12px; font-size:0.9em; border-radius:3px; margin-top:5px; margin-bottom:15px; }
.modal-actions { margin-top:20px; text-align:right; }
.modal-actions button { padding:10px 18px; margin-left:10px; border-radius:4px; border:none; cursor:pointer; font-weight:500; }
.modal-button-submit { background-color:#007bff; color:white; }
.modal-button-cancel { background-color:#6c757d; color:white; }
.error { color: red; margin-top:10px; }
</style>
