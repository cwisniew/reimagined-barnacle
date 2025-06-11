<template>
  <form @submit.prevent="handleSubmit" class="add-game-form">
    <h2>Add New Board Game</h2>
    <div v-if="populatedBggId" class="bgg-info">
      <p>Populated from BGG ID: {{ populatedBggId }}
        <button type="button" @click="clearBggLink" class="clear-bgg-link-btn">Clear BGG Link</button>
      </p>
    </div>

    <!-- Core Info -->
    <div><label for="name">Name:</label><input type="text" id="name" v-model="form.name" required /></div>
    <div><label for="description">Description:</label><textarea id="description" v-model="form.description" rows="3" required></textarea></div>
    <div><label for="version">Version/Edition (Optional):</label><input type="text" id="version" v-model="form.version" /></div>

    <!-- Status -->
    <div>
      <label for="status">Status:</label>
      <select id="status" v-model="form.status">
        <option value="">Select Status</option>
        <option value="Owned">Owned</option>
        <option value="Wishlist">Wishlist</option>
        <option value="Played">Played</option>
        <option value="Unopened">Unopened</option>
        <option value="Shrink-wrapped">Shrink-wrapped</option>
        <option value="Preordered">Preordered</option>
        <option value="Sold">Sold</option>
      </select>
    </div>

    <!-- BGG Specific - often pre-filled -->
    <div class="grid-2-col">
      <div><label for="bggId">BGG ID:</label><input type="number" id="bggId" v-model.number="form.bggId" /></div>
      <div><label for="yearPublished">Year Published:</label><input type="number" id="yearPublished" v-model.number="form.yearPublished" /></div>
      <div><label for="bggRating">BGG Rating:</label><input type="number" step="0.01" id="bggRating" v-model.number="form.bggRating" /></div>
      <div><label for="bggComplexity">BGG Complexity:</label><input type="number" step="0.01" id="bggComplexity" v-model.number="form.bggComplexity" /></div>
      <div><label for="minPlayers">Min Players:</label><input type="number" id="minPlayers" v-model.number="form.minPlayers" /></div>
      <div><label for="maxPlayers">Max Players:</label><input type="number" id="maxPlayers" v-model.number="form.maxPlayers" /></div>
      <div><label for="playingTime">Playing Time (min):</label><input type="number" id="playingTime" v-model.number="form.playingTime" /></div>
    </div>

    <!-- Image URLs - often pre-filled -->
    <div><label for="thumbnailUrl">Thumbnail URL:</label><input type="url" id="thumbnailUrl" v-model="form.thumbnailUrl" /></div>
    <div v-if="form.thumbnailUrl"><img :src="form.thumbnailUrl" alt="Thumbnail" class="form-thumbnail"/></div>
    <div><label for="imageUrl">Image URL:</label><input type="url" id="imageUrl" v-model="form.imageUrl" /></div>


    <button type="submit" :disabled="boardGameStore.loading">
      {{ boardGameStore.loading ? "Adding..." : "Add Game" }}
    </button>
    <div v-if="formError" class="error">Error adding game: {{ formError }}</div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";
import { useBggFormStore } from "../stores/bggFormStore";
import type { BoardGame } from "../types";

const boardGameStore = useBoardGameStore();
const bggFormStore = useBggFormStore();

// Use a reactive object for the form
const initialFormState = (): Omit<BoardGame, "id" | "playCount" | "lastPlayedDate"> => ({
  name: "",
  description: "",
  version: "",
  bggId: undefined,
  status: "",
  bggRating: undefined,
  bggComplexity: undefined,
  yearPublished: undefined,
  minPlayers: undefined,
  maxPlayers: undefined,
  playingTime: undefined,
  thumbnailUrl: "",
  imageUrl: "",
});

const form = reactive(initialFormState());
const populatedBggId = ref<number | undefined>(undefined); // To show the "Populated from BGG ID" message
const formError = ref<string | null>(null);

watch(() => bggFormStore.bggGameDataForForm, (newData) => {
  if (newData) {
    form.name = newData.name || "";
    form.description = newData.description || "";
    form.version = newData.yearPublished?.toString() || ""; // Default version to yearPublished
    form.bggId = newData.bggId;
    form.bggRating = newData.bggRating;
    form.bggComplexity = newData.bggComplexity;
    form.yearPublished = newData.yearPublished;
    form.minPlayers = newData.minPlayers;
    form.maxPlayers = newData.maxPlayers;
    form.playingTime = newData.playingTime;
    form.thumbnailUrl = newData.thumbnailUrl || "";
    form.imageUrl = newData.imageUrl || "";
    // form.status = ""; // Let user choose status

    populatedBggId.value = newData.bggId;
    bggFormStore.clearBggGameData();
  }
}, { deep: true });


const clearBggLink = () => {
  populatedBggId.value = undefined;
  // Optionally clear BGG related fields from form if user wants to "de-link"
  form.bggId = undefined;
  // Potentially clear other BGG specific fields or leave them for manual editing
};

const handleSubmit = async () => {
  formError.value = null;
  if (!form.name.trim() || !form.description.trim()) {
    formError.value = "Name and description are required.";
    return;
  }

  boardGameStore.error = null;

  // Construct gameData from the reactive form object
  const gameData: Omit<BoardGame, "id"> = { ...form };

  await boardGameStore.addGame(gameData);

  if (boardGameStore.error) {
      formError.value = boardGameStore.error;
  } else {
    Object.assign(form, initialFormState()); // Reset form
    populatedBggId.value = undefined;
  }
};
</script>

<style scoped>
.add-game-form { padding: 15px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9; margin-bottom: 20px; }
.add-game-form div:not(.grid-2-col) { margin-bottom: 10px; }
label { display: block; margin-bottom: 5px; font-weight: bold; }
input[type="text"], input[type="number"], input[type="url"], textarea, select {
  width: 100%; /* Fallback for non-grid items */
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 3px;
}
textarea { min-height: 60px; }
.grid-2-col { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom:10px }
.grid-2-col > div { margin-bottom: 0; } /* Remove bottom margin from grid items */
button[type="submit"] { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; margin-top:10px; }
button:disabled { background-color: #aaa; }
.error { color: red; margin-top: 10px; }
.bgg-info { background-color: #e6f7ff; border: 1px solid #91d5ff; padding: 8px; margin-bottom: 10px; border-radius: 3px; font-size: 0.9em; }
.clear-bgg-link-btn { background-color: #ffc107; color: #212529; border: none; padding: 3px 8px; font-size: 0.8em; border-radius: 3px; cursor: pointer; margin-left: 10px; }
.form-thumbnail { max-width: 100px; max-height: 100px; display: block; margin-top: 5px; border: 1px solid #ddd; }
</style>
