<template>
  <div class="game-list-container">
    <!-- Add New Game Button -->
    <div class="add-new-game-controls">
      <button @click="editGameStore.enterAddMode()" v-if="!editGameStore.showForm" class="add-new-btn">
        + Add New Board Game
      </button>
    </div>
    <!-- Form is now conditionally rendered by editGameStore.showForm -->
    <AddBoardGameForm />


    <h2>My Board Games ({{ filteredGames.length }} / {{ boardGameStore.games.length }})</h2>
    <div class="controls">
       <div class="filter-status"><label for="statusFilter">Filter by Status:</label><select id="statusFilter" v-model="selectedStatus">
        <option value="">All Statuses</option><option v-for="sOpt in statusFilterOptions" :key="sOpt" :value="sOpt">{{sOpt}}</option></select></div>
    </div>
    <div v-if="boardGameStore.loading && initialLoad">Loading games...</div>
    <div v-else-if="boardGameStore.error && !boardGameStore.loading" class="error">Error: {{ boardGameStore.error }}</div>

    <ul v-else-if="filteredGames.length > 0" class="game-list">
      <li v-for="game in filteredGames" :key="game.id" class="game-item" :class="[{ 'is-expansion-item': game.isExpansion }, statusClass(game.status)]">
        <div class="game-thumbnail" v-if="game.thumbnailUrl"><img :src="game.thumbnailUrl" :alt="game.name + ` thumbnail`"/></div>
        <div class="game-info">
          <h3>{{ game.name }} <span v-if="game.isExpansion" class="expansion-tag">[Exp]</span></h3>
          <p v-if="game.status" class="game-meta status-tag" :class="statusClass(game.status)">Status: <strong>{{ game.status }}</strong></p>

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

          <div class="game-actions">
            <button @click="handleEditGame(game)" class="edit-btn">Edit</button>
            <button @click="handleDeleteGame(game.id)" class="delete-btn">Delete</button>
          </div>
        </div>
      </li>
    </ul>
    <p v-else>No games in your collection yet.</p>

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
import { useEditGameStore } from "../stores/editGameStore";
import AddBoardGameForm from "./AddBoardGameForm.vue";
import type { BoardGame, PlaySession } from "../types";

const boardGameStore = useBoardGameStore();
const editGameStore = useEditGameStore();

const initialLoad = ref(true);
const selectedStatus = ref("");
const statusFilterOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);

const showLogPlayModal = ref(false);
const currentGameForPlayLog = ref<BoardGame | null>(null);
const playLogForm = reactive({ date: new Date().toISOString().split("T")[0], playerNamesString: "", notes: "" });
const playLogSubmitLoading = ref(false);
const playLogError = ref<string | null>(null);

onMounted(async()=>{ if (boardGameStore.games.length === 0) { initialLoad.value = true; await boardGameStore.fetchGames(); initialLoad.value = false; } else { initialLoad.value = false; } });
const formatDate=(ds?:string)=>ds?new Date(ds).toLocaleDateString():"";
const filteredGames=computed(()=>boardGameStore.games.filter(g=>!selectedStatus.value||g.status===selectedStatus.value));
const getPlayCount = (game: BoardGame) => game.plays?.length || 0;
const getLastPlayedDate = (game: BoardGame): string | undefined => { if (!game.plays || game.plays.length === 0) return undefined; return game.plays[0].date; };
const statusClass = (status?: string): string => { if (!status) return ""; return `status-${status.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`; };
const getBaseGameName=(id:string)=>boardGameStore.games.find(g=>g.id===id)?.name; // Added to ensure it's present


const openLogPlayModal = (game: BoardGame) => { currentGameForPlayLog.value=game;playLogForm.date=new Date().toISOString().split("T")[0];playLogForm.playerNamesString="";playLogForm.notes="";playLogError.value=null;showLogPlayModal.value=true;};
const closeLogPlayModal = () => { showLogPlayModal.value=false;currentGameForPlayLog.value=null;};
const submitLogPlay = async () => { if(!currentGameForPlayLog.value)return;playLogSubmitLoading.value=true;playLogError.value=null;const pD:Omit<PlaySession,"id">={date:playLogForm.date,playerNames:playLogForm.playerNamesString.split(",").map(s=>s.trim()).filter(s=>s),notes:playLogForm.notes};const suc=await boardGameStore.addPlaySession(currentGameForPlayLog.value.id,pD);if(suc){closeLogPlayModal()}else{playLogError.value=boardGameStore.error||"Failed to save."}playLogSubmitLoading.value=false;};
const fetchGamesWithLoading = async () => { initialLoad.value = true; await boardGameStore.fetchGames(); initialLoad.value = false; }; // Added definition

const handleEditGame = (game: BoardGame) => {
  editGameStore.setGameToEdit(game);
  const formElement = document.querySelector('.add-game-form');
  if (formElement) {
    formElement.scrollIntoView({ behavior: "smooth" });
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

const confirmDeletePlay = async (gameId: string, playId: string) => { // Added definition
  if (window.confirm("Are you sure you want to delete this play session?")) {
    const success = await boardGameStore.deletePlaySession(gameId, playId);
    if (!success) {
      alert(boardGameStore.error || "Failed to delete play session.");
    }
  }
};
</script>
<style scoped>
.add-new-game-controls { margin-bottom: 20px; text-align: center; }
.add-new-btn { background-color: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 4px; font-size: 1em; cursor: pointer; }
.add-new-btn:hover { background-color: #0056b3; }
.game-actions { margin-top: 10px; display: flex; gap: 10px; justify-content: flex-end; }
.edit-btn, .delete-btn { padding: 5px 10px; font-size: 0.9em; border-radius: 3px; cursor: pointer; border: none; color: white; }
.edit-btn { background-color: #ffc107; color: #212529; }
.delete-btn { background-color: #dc3545; }
.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:1000}
.modal-content{background-color:#fff;padding:20px;border-radius:5px;box-shadow:0 2px 10px rgba(0,0,0,.1);width:90%;max-width:500px}
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
</style>
