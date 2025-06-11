<template>
  <form @submit.prevent="handleSubmit" class="add-game-form">
    <h2>Add New Board Game</h2>
    <div v-if="populatedBggId" class="bgg-info">
      <p>Populated from BGG ID: {{ populatedBggId }}
        <button type="button" @click="clearBggLink" class="clear-bgg-link-btn">Clear BGG Link</button>
      </p>
      <p v-if="form.isExpansionFromBgg" class="bgg-expansion-info">
        BGG data indicates this is an expansion for game ID: {{ form.bggBaseGameIdFromBgg }}.
      </p>
    </div>

    <!-- Core Info -->
    <div><label for="name">Name:</label><input type="text" id="name" v-model="form.name" required /></div>
    <div><label for="description">Description:</label><textarea id="description" v-model="form.description" rows="3" required></textarea></div>
    <div><label for="version">Version/Edition (Optional):</label><input type="text" id="version" v-model="form.version" /></div>
    <div>
      <label for="status">Status:</label>
      <select id="status" v-model="form.status">
        <option value="">Select Status</option>
        <option value="Owned">Owned</option><option value="Wishlist">Wishlist</option><option value="Played">Played</option>
        <option value="Unopened">Unopened</option><option value="Shrink-wrapped">Shrink-wrapped</option>
        <option value="Preordered">Preordered</option><option value="Sold">Sold</option>
      </select>
    </div>

    <!-- Location Section -->
    <div class="location-section section-box">
      <h4>Storage Location</h4>
      <div class="grid-2-col">
        <div><label for="locationRoom">Room:</label><input type="text" id="locationRoom" v-model="form.locationRoom" /></div>
        <div><label for="locationCupboard">Cupboard/Area:</label><input type="text" id="locationCupboard" v-model="form.locationCupboard" /></div>
        <div><label for="locationShelf">Shelf:</label><input type="text" id="locationShelf" v-model="form.locationShelf" /></div>
      </div>
      <div><label for="locationNotes">Location Notes (e.g., specific spot):</label><input type="text" id="locationNotes" v-model="form.locationNotes" /></div>
    </div>

    <!-- Expansion Fields -->
    <div class="expansion-fields section-box">
      <h4>Expansion Details</h4>
      <label class="checkbox-label">
        <input type="checkbox" v-model="form.isExpansion" /> Is this an Expansion?
      </label>
      <div v-if="form.isExpansion">
        <label for="baseGameAppId">Base Game (select from your collection):</label>
        <select id="baseGameAppId" v-model="form.baseGameAppId">
          <option value="">None (or enter BGG ID below)</option>
          <option v-for="game in availableBaseGames" :key="game.id" :value="game.id">{{ game.name }}</option>
        </select>
        <label for="bggBaseGameIdManual">BGG ID of Base Game (if known & not in collection):</label>
        <input type="number" id="bggBaseGameIdManual" v-model.number="form.bggBaseGameId" placeholder="BGG ID of base" />
      </div>
    </div>

    <!-- BGG Details & Linked Data -->
    <div class="bgg-details-section section-box">
      <h4>BGG Details & Linked Data</h4>
      <div class="grid-2-col">
        <div><label for="bggId">BGG ID:</label><input type="number" id="bggId" v-model.number="form.bggId"/></div>
        <div><label for="yearPublished">Year Published:</label><input type="number" id="yearPublished" v-model.number="form.yearPublished"/></div>
        <div><label for="bggRating">BGG Rating (0-10):</label><input type="number" step="0.01" id="bggRating" v-model.number="form.bggRating"/></div>
        <div><label for="bggComplexity">BGG Complexity (1-5):</label><input type="number" step="0.01" id="bggComplexity" v-model.number="form.bggComplexity"/></div>
        <div><label for="minPlayers">Min Players:</label><input type="number" id="minPlayers" v-model.number="form.minPlayers"/></div>
        <div><label for="maxPlayers">Max Players:</label><input type="number" id="maxPlayers" v-model.number="form.maxPlayers"/></div>
        <div><label for="playingTime">Playing Time (min):</label><input type="number" id="playingTime" v-model.number="form.playingTime"/></div>
      </div>
      <div><label for="designers">Designers (comma-separated):</label><input type="text" id="designers" v-model="form.designersString"/></div>
      <div><label for="publishers">Publishers (comma-separated):</label><input type="text" id="publishers" v-model="form.publishersString"/></div>
      <div><label for="categories">Categories/Themes (comma-separated):</label><input type="text" id="categories" v-model="form.categoriesString"/></div>
      <div><label for="mechanics">Mechanics (comma-separated):</label><input type="text" id="mechanics" v-model="form.mechanicsString"/></div>
    </div>

    <div class="image-section section-box">
      <h4>Images</h4>
      <div><label for="thumbnailUrl">Thumbnail URL:</label><input type="url" id="thumbnailUrl" v-model="form.thumbnailUrl"/></div>
      <div v-if="form.thumbnailUrl"><img :src="form.thumbnailUrl" alt="Thumbnail" class="form-thumbnail"/></div>
      <div><label for="imageUrl">Image URL:</label><input type="url" id="imageUrl" v-model="form.imageUrl"/></div>
    </div>

    <button type="submit" :disabled="boardGameStore.loading">Add Game</button>
    <div v-if="formError" class="error">{{ formError }}</div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from "vue";
import { useBoardGameStore } from "../stores/boardGameStore";
import { useBggFormStore } from "../stores/bggFormStore";
import type { BoardGame } from "../types";

interface FormExpansionTempData { isExpansionFromBgg?: boolean; bggBaseGameIdFromBgg?: number; }
interface StringArrayFields { designersString: string; publishersString: string; categoriesString: string; mechanicsString: string; }

const boardGameStore = useBoardGameStore();
const bggFormStore = useBggFormStore();

const initialFormState = (): Omit<BoardGame, "id" | "playCount" | "lastPlayedDate"> & FormExpansionTempData & StringArrayFields => ({
  name: "", description: "", version: "", bggId: undefined, status: "",
  bggRating: undefined, bggComplexity: undefined, yearPublished: undefined,
  minPlayers: undefined, maxPlayers: undefined, playingTime: undefined,
  thumbnailUrl: "", imageUrl: "",
  isExpansion: false, baseGameAppId: "", bggBaseGameId: undefined, bggExpansionIds: [],
  designers: [], publishers: [], categories: [], mechanics: [],
  // New location fields
  locationRoom: "", locationCupboard: "", locationShelf: "", locationNotes: "",
  isExpansionFromBgg: false, bggBaseGameIdFromBgg: undefined,
  designersString: "", publishersString: "", categoriesString: "", mechanicsString: "",
});

const form = reactive(initialFormState());
const populatedBggId = ref<number | undefined>(undefined);
const formError = ref<string | null>(null);

const availableBaseGames = computed(() => boardGameStore.games.filter(g => !g.isExpansion && g.id !== (form as any).id));
const arrayToString = (arr?: string[]) => arr?.join(", ") || "";
const stringToArray = (str?: string) => str ? str.split(",").map(s => s.trim()).filter(s => s) : [];

watch(() => bggFormStore.bggGameDataForForm, (newData) => {
  if (newData) {
    form.name = newData.name || ""; form.description = newData.description || "";
    form.version = newData.yearPublished?.toString() || ""; form.bggId = newData.bggId;
    form.bggRating = newData.bggRating; form.bggComplexity = newData.bggComplexity;
    form.yearPublished = newData.yearPublished; form.minPlayers = newData.minPlayers;
    form.maxPlayers = newData.maxPlayers; form.playingTime = newData.playingTime;
    form.thumbnailUrl = newData.thumbnailUrl || ""; form.imageUrl = newData.imageUrl || "";
    form.isExpansion = newData.isExpansionFromBgg || false;
    form.bggBaseGameId = newData.bggBaseGameIdFromBgg;
    form.designersString = arrayToString(newData.designersFromBgg);
    form.publishersString = arrayToString(newData.publishersFromBgg);
    form.categoriesString = arrayToString(newData.categoriesFromBgg);
    form.mechanicsString = arrayToString(newData.mechanicsFromBgg);
    form.isExpansionFromBgg = newData.isExpansionFromBgg;
    form.bggBaseGameIdFromBgg = newData.bggBaseGameIdFromBgg;
    populatedBggId.value = newData.bggId;
    // Location fields are not typically from BGG, so they are not populated here.
    bggFormStore.clearBggGameData();
  }
}, { deep: true });

const clearBggLink = () => { populatedBggId.value = undefined; form.bggId = undefined; form.isExpansionFromBgg = false; form.bggBaseGameIdFromBgg = undefined;};
const handleSubmit = async () => {
  formError.value = null; if (!form.name.trim() || !form.description.trim()) { formError.value = "Name/Desc required."; return; }
  boardGameStore.error = null;
  const gameDataToSubmit: Partial<BoardGame> = { ...form };
  gameDataToSubmit.designers = stringToArray(form.designersString); gameDataToSubmit.publishers = stringToArray(form.publishersString);
  gameDataToSubmit.categories = stringToArray(form.categoriesString); gameDataToSubmit.mechanics = stringToArray(form.mechanicsString);
  delete (gameDataToSubmit as any).isExpansionFromBgg; delete (gameDataToSubmit as any).bggBaseGameIdFromBgg;
  delete (gameDataToSubmit as any).designersString; delete (gameDataToSubmit as any).publishersString;
  delete (gameDataToSubmit as any).categoriesString; delete (gameDataToSubmit as any).mechanicsString;
  if (!form.isExpansion) { gameDataToSubmit.baseGameAppId = undefined; gameDataToSubmit.bggBaseGameId = undefined; }
  await boardGameStore.addGame(gameDataToSubmit as Omit<BoardGame, "id">);
  if (boardGameStore.error) { formError.value = boardGameStore.error; }
  else { Object.assign(form, initialFormState()); populatedBggId.value = undefined; }
};
</script>
<style scoped>
.add-game-form{padding:15px;border:1px solid #ccc;border-radius:5px;background-color:#f9f9f9;margin-bottom:20px}
.add-game-form > div:not(.grid-2-col):not(.section-box){margin-bottom:10px}
label{display:block;margin-bottom:5px;font-weight:700}
input[type=text],input[type=number],input[type=url],textarea,select{width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;border-radius:3px}
textarea{min-height:60px}
.grid-2-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px}
.grid-2-col > div{margin-bottom:0}
button[type=submit]{padding:10px 15px;background-color:#007bff;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-top:15px}
.error{color:red;margin-top:10px}
.bgg-info{background-color:#e6f7ff;border:1px solid #91d5ff;padding:8px;margin-bottom:10px;border-radius:3px;font-size:.9em}
.bgg-expansion-info{color:#0056b3;font-style:italic;margin-top:5px}
.clear-bgg-link-btn{background-color:#ffc107;color:#212529;border:none;padding:3px 8px;font-size:.8em;border-radius:3px;cursor:pointer;margin-left:10px}
.form-thumbnail{max-width:100px;max-height:100px;display:block;margin-top:5px;border:1px solid #ddd}
.section-box{border:1px solid #add8e6;padding:10px;margin-bottom:15px;border-radius:4px;background-color:#f7fcff}
.section-box h4{margin-top:0;margin-bottom:10px;color:#0056b3;border-bottom:1px solid #add8e6;padding-bottom:5px}
.section-box > div{margin-bottom:10px}
.expansion-fields > div{margin-top:10px}
.checkbox-label{display:flex;align-items:center;font-weight:400}
.checkbox-label input[type=checkbox]{margin-right:8px;width:auto}
</style>
