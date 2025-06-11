<template>
  <form @submit.prevent="handleSubmit" class="add-game-form">
    <h2>Add New Board Game</h2>
    <div v-if="bggId" class="bgg-info">
      <p>Populated from BGG ID: {{ bggId }} <button type="button" @click="clearBggLink" class="clear-bgg-link-btn">Clear BGG Link</button></p>
    </div>
    <div>
      <label for="name">Name:</label>
      <input type="text" id="name" v-model="name" required />
    </div>
    <div>
      <label for="description">Description:</label>
      <textarea id="description" v-model="description" rows="5" required></textarea>
    </div>
    <div>
      <label for="version">Version/Edition/Year (Optional):</label>
      <input type="text" id="version" v-model="version" />
    </div>
    <button type="submit" :disabled="boardGameStore.loading">
      {{ boardGameStore.loading ? "Adding..." : "Add Game" }}
    </button>
    <div v-if="formError" class="error">Error adding game: {{ formError }}</div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";
import { useBggFormStore } from "../stores/bggFormStore";
import type { BoardGame } from "../types";

const boardGameStore = useBoardGameStore();
const bggFormStore = useBggFormStore();

const name = ref("");
const description = ref("");
const version = ref("");
const bggId = ref<number | undefined>(undefined);
const formError = ref<string | null>(null);

watch(() => bggFormStore.bggGameDataForForm, (newData) => {
  if (newData) {
    const processed = bggFormStore.getProcessedBggData();
    name.value = processed.name;
    description.value = processed.description;
    version.value = processed.version;
    bggId.value = processed.bggId;
    bggFormStore.clearBggGameData();
  }
}, { deep: true });

onMounted(() => {
    if (bggFormStore.bggGameDataForForm) {
        const processed = bggFormStore.getProcessedBggData();
        name.value = processed.name;
        description.value = processed.description;
        version.value = processed.version;
        bggId.value = processed.bggId;
        bggFormStore.clearBggGameData();
    }
});

const clearBggLink = () => {
  bggId.value = undefined;
};

const handleSubmit = async () => {
  formError.value = null;
  if (!name.value.trim() || !description.value.trim()) {
    formError.value = "Please fill in both name and description.";
    return;
  }

  boardGameStore.error = null;

  const gameData: Omit<BoardGame, "id"> = {
    name: name.value,
    description: description.value,
  };
  if (version.value.trim()) {
    gameData.version = version.value.trim();
  }
  // If bggId is to be saved, it should be added to BoardGame type and here.
  // Example: if (bggId.value) gameData.bggId = bggId.value;

  await boardGameStore.addGame(gameData);

  if (boardGameStore.error) {
      formError.value = boardGameStore.error;
  } else {
    name.value = "";
    description.value = "";
    version.value = "";
    bggId.value = undefined;
  }
};
</script>

<style scoped>
.add-game-form { padding: 15px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9; margin-bottom: 20px; }
.add-game-form div { margin-bottom: 10px; }
label { display: block; margin-bottom: 5px; }
input[type="text"], textarea { width: calc(100% - 16px); padding: 8px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 3px;}
textarea {min-height: 80px;}
button { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
button:disabled { background-color: #aaa; }
.error { color: red; margin-top: 10px; }
.bgg-info { background-color: #e6f7ff; border: 1px solid #91d5ff; padding: 8px; margin-bottom: 10px; border-radius: 3px; font-size: 0.9em; }
.clear-bgg-link-btn { background-color: #ffc107; color: #212529; border: none; padding: 3px 8px; font-size: 0.8em; border-radius: 3px; cursor: pointer; margin-left: 10px; }
</style>
