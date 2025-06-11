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
      <div class="filter-status">
        <label for="statusFilter">Filter by Status:</label>
        <select id="statusFilter" v-model="selectedStatus">
          <option value="">All Statuses</option>
          <option v-for="statusItem in statusFilterOptions" :key="statusItem" :value="statusItem">
            {{ statusItem }}
          </option>
        </select>
      </div>
      <span>Displaying {{ filteredGames.length }} of {{ boardGameStore.games.length }} games</span>
    </div>

    <div v-if="boardGameStore.loading && initialLoad" class="loading-indicator">Loading games...</div>
    <div v-else-if="boardGameStore.error && !boardGameStore.loading" class="error-message">
      Error fetching games: {{ boardGameStore.error }}
      <button @click="fetchGamesWithLoading" class="refresh-btn">Try Refresh</button>
    </div>

    <ul v-else-if="filteredGames.length > 0" class="game-list">
      <li v-for="game in filteredGames" :key="game.id" class="game-item" :class="[{ 'is-expansion-item': game.isExpansion }, statusClass(game.status)]">
        <div class="game-thumbnail" v-if="game.thumbnailUrl">
          <router-link :to="{ name: 'GameDetail', params: { id: game.id } }">
            <img :src="game.thumbnailUrl" :alt="game.name + ` thumbnail`" />
          </router-link>
        </div>
        <div class="game-info">
          <h3>
            <router-link :to="{ name: 'GameDetail', params: { id: game.id } }">{{ game.name }}</router-link>
            <span v-if="game.isExpansion" class="expansion-tag">[Exp]</span>
          </h3>
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
    <p v-else-if="boardGameStore.games.length > 0 && filteredGames.length === 0" class="no-games-message">
      No games match the current filter.
    </p>
    <p v-else class="no-games-message">Your collection is empty. Add some games!</p>

    <!-- Log Play Modal - Updated for Per-Player Details -->
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
// import { useRouter } from "vue-router"; // Not directly used now
import { v4 as uuidv4 } from "uuid";
import { useBoardGameStore } from "../stores/boardGameStore";
import { useEditGameStore } from "../stores/editGameStore";
import AddBoardGameForm from "./AddBoardGameForm.vue";
import type { BoardGame, PlaySession, PlayerInPlaySession } from "../types";

// const router = useRouter(); // Not needed if navigation is handled by GameDetailView or editGameStore
const boardGameStore = useBoardGameStore();
const editGameStore = useEditGameStore();

const initialLoad = ref(true);
const selectedStatus = ref("");
const statusFilterOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);

// Log Play Modal State
const showLogPlayModal = ref(false);
const currentGameForPlayLog = ref<BoardGame | null>(null);
const initialPlayLogFormState = () => ({
  date: new Date().toISOString().split("T")[0],
  playersInSession: [] as PlayerInPlaySession[],
  notes: ""
});
const playLogForm = reactive(initialPlayLogFormState());
const playLogSubmitLoading = ref(false);
const playLogError = ref<string | null>(null);

const fetchGamesWithLoading = async () => { initialLoad.value = true; await boardGameStore.fetchGames(); initialLoad.value = false; };
onMounted(async () => { if (boardGameStore.games.length === 0) { await fetchGamesWithLoading(); } else { initialLoad.value = false; }});

const filteredGames = computed(() => boardGameStore.games.filter(g => !selectedStatus.value || g.status === selectedStatus.value));

const handleEditGame = (game: BoardGame) => {
  editGameStore.setGameToEdit(game);
  if (document.querySelector('.add-game-form')) {
    (document.querySelector('.add-game-form') as HTMLElement).scrollIntoView({ behavior: 'smooth' });
  } else {
     window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const handleDeleteGame = async (gameId: string) => {
  if (window.confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
    const success = await boardGameStore.deleteGame(gameId);
    if (!success) {
      alert(boardGameStore.error || "Failed to delete game.");
    } else {
      if (editGameStore.gameToEdit && editGameStore.gameToEdit.id === gameId) {
        editGameStore.clearGameToEditAndHideForm();
      }
    }
  }
};

const statusClass = (s?:string) => s ? `status-${s.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")}` : "";
const formatDate=(ds?:string)=>ds?new Date(ds).toLocaleDateString():"";
const getPlayCount = (game: BoardGame) => game.plays?.length || 0;
const getLastPlayedDate = (game: BoardGame): string | undefined => { if (!game.plays || game.plays.length === 0) return undefined; return game.plays[0].date; };

const openLogPlayModal = (game: BoardGame) => {
  currentGameForPlayLog.value = game;
  Object.assign(playLogForm, initialPlayLogFormState());
  addPlayerToPlayLog(); // Add one player by default
  playLogError.value = null;
  showLogPlayModal.value = true;
};
const closeLogPlayModal = () => { showLogPlayModal.value = false; currentGameForPlayLog.value = null; };

const addPlayerToPlayLog = () => {
  playLogForm.playersInSession.push({ id: uuidv4(), name: "", enjoyment: undefined, won: false, notes: "" });
};
const removePlayerFromPlayLog = (index: number) => {
  playLogForm.playersInSession.splice(index, 1);
};

const submitLogPlay = async () => {
  if (!currentGameForPlayLog.value) return;
  if (playLogForm.playersInSession.some(p => !p.name.trim())) {
    playLogError.value = "All added players must have a name."; return;
  }
  playLogSubmitLoading.value = true; playLogError.value = null;
  const playData: Omit<PlaySession, "id"> = {
    date: playLogForm.date,
    playersInSession: playLogForm.playersInSession.filter(p => p.name.trim()),
    notes: playLogForm.notes
  };
  const success = await boardGameStore.addPlaySession(currentGameForPlayLog.value.id, playData);
  if (success) closeLogPlayModal();
  else playLogError.value = boardGameStore.error || "Failed to save play session.";
  playLogSubmitLoading.value = false;
};

const confirmDeletePlay = async (gameId: string, playId: string) => { // This is for deleting plays from GameDetailView, keep it there.
  // This was accidentally copied here, BoardGameList.vue does not list individual plays to delete.
  // For now, this function will not be used in this component.
  console.warn("confirmDeletePlay called from BoardGameList - this should be on GameDetailView");
};

</script>

<style scoped>
.board-game-list-view { padding: 10px; }
.page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
.add-new-btn-page { background-color:#007bff; color:white; padding:10px 15px; border:none; border-radius:4px; font-size: 1em; cursor:pointer; }
.list-controls { margin-bottom: 15px; display:flex; gap:20px; align-items:center; background-color:#f8f9fa; padding:10px; border-radius:4px;}
.filter-status label { margin-right: 5px; }
.filter-status select { padding: 5px; border-radius: 3px; }
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
.modal-content > div {margin-bottom:15px;} /* Spacing for direct children like date, notes */
.modal-content label{display:block;margin-bottom:6px;font-weight:500;color:#444}
.modal-content input[type="date"], .modal-content input[type="text"], .modal-content textarea, .modal-content select {width:100%;padding:10px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;font-size:1em}
.player-in-session-item { border:1px solid #e0e0e0; padding:12px; margin-bottom:12px; border-radius:4px; background:#f9f9f9; }
.player-in-session-item .player-name-input { width: calc(50% - 5px); margin-right: 10px; display:inline-block; vertical-align: middle;}
.player-in-session-item .player-enjoyment-select { width: calc(30% - 5px); margin-right:10px; display:inline-block; vertical-align: middle;}
.player-in-session-item .checkbox-label { font-size:0.9em; margin-left:0; display:inline-flex; align-items:center; width:auto; vertical-align: middle; }
.player-in-session-item .checkbox-label input[type="checkbox"] { width:auto; margin-right:5px; }
.player-in-session-item .player-notes-input { margin-top:8px; font-size:0.95em; }
.remove-player-btn { background-color:#e74c3c; color:white; border:none; padding:6px 9px; font-size:0.8em; border-radius:3px; float:right; }
.add-player-btn { background-color:#3498db; color:white; border:none; padding:8px 12px; font-size:0.9em; border-radius:3px; margin-top:5px; margin-bottom:15px; }
.modal-actions { margin-top:20px; text-align:right; }
.modal-actions button { padding:10px 18px; margin-left:10px; border-radius:4px; border:none; cursor:pointer; font-weight:500; }
.modal-button-submit { background-color:#007bff; color:white; }
.modal-button-cancel { background-color:#6c757d; color:white; }
.error { color: red; margin-top:10px; }
</style>
