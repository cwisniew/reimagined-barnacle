<template>
  <div v-if="editGameStore.showForm" class="form-container">
    <form @submit.prevent="handleSubmit" class="add-game-form">
      <h2>{{ editGameStore.isEditMode ? "Edit Board Game" : "Add New Board Game" }}</h2>

      <div v-if="editGameStore.isEditMode && form.id" class="editing-info">
        <p>Editing: <strong>{{ form.name || "Game ID: " + form.id }}</strong></p>
      </div>

      <div v-if="populatedBggId && !editGameStore.isEditMode" class="bgg-info">
        <p>Populated from BGG ID: {{ populatedBggId }} <button type="button" @click="clearBggLink" class="clear-bgg-link-btn">Clear BGG Link</button></p>
        <p v-if="form.isExpansionFromBgg" class="bgg-expansion-info">BGG: This is an expansion for game ID {{ form.bggBaseGameIdFromBgg }}.</p>
      </div>

    <!-- Core Info -->
    <div><label for="name">Name:</label><input type="text" id="name" v-model="form.name" required /></div>
    <div><label for="description">Description:</label><textarea id="description" v-model="form.description" rows="3" required></textarea></div>
    <div><label for="version">Version/Edition:</label><input type="text" id="version" v-model="form.version" /></div>
    <div><label for="status">Status:</label>
      <select id="status" v-model="form.status">
        <option value="">Select Status</option>
        <option v-for="sOpt in statusOptions" :key="sOpt" :value="sOpt">{{ sOpt }}</option>
      </select>
    </div>

    <!-- Display BGG Videos if available from BGG fetch (only in add mode with BGG data) -->
    <div v-if="!editGameStore.isEditMode && bggFormStore.bggGameDataForForm && bggFormStore.bggGameDataForForm.bggVideosFromBgg && bggFormStore.bggGameDataForForm.bggVideosFromBgg.length > 0" class="bgg-videos-section section-box">
      <h4>Suggested Videos from BGG <span class="form-note">(not saved with game)</span></h4>
      <ul>
        <li v-for="(video, index) in bggFormStore.bggGameDataForForm.bggVideosFromBgg" :key="index">
          <a :href="video.url" target="_blank" rel="noopener noreferrer">{{ video.title }}</a>
          <span v-if="video.language"> ({{ video.language }})</span>
          <span v-if="video.uploader"> - by {{ video.uploader }}</span>
        </li>
      </ul>
      <p class="form-note">Consider copying useful video links to "Other Links" to save them.</p>
    </div>

    <!-- Card Sleeve Inventory Section -->
    <div class="card-sleeve-section section-box">
      <h4>Card Sleeve Inventory</h4>
      <div v-for="(cardSet, index) in form.cardSets" :key="cardSet.id" class="card-set-item">
        <h5>Set {{ index + 1 }} <button type="button" @click="removeCardSet(index)" class="remove-set-btn">Remove Set</button></h5>
        <div class="grid-2-col">
          <div><label :for="`cs-cat-${index}`">Category Name:</label><input :id="`cs-cat-${index}`" type="text" v-model="cardSet.categoryName" placeholder="e.g., Event Cards" required /></div>
          <div><label :for="`cs-size-${index}`">Card Size:</label><input :id="`cs-size-${index}`" type="text" v-model="cardSet.cardSize" placeholder="e.g., Standard, 63x88mm" /></div>
          <div><label :for="`cs-count-${index}`">Total Cards in Set:</label><input :id="`cs-count-${index}`" type="number" v-model.number="cardSet.cardCount" placeholder="0" required min="0" /></div>
          <div><label :for="`cs-sleeved-${index}`">Cards Sleeved:</label><input :id="`cs-sleeved-${index}`" type="number" v-model.number="cardSet.sleevedCount" placeholder="0" min="0" /></div>
        </div>
        <div><label :for="`cs-notes-${index}`">Sleeve Notes (brand, type, etc.):</label><textarea :id="`cs-notes-${index}`" v-model="cardSet.sleeveNotes" rows="2"></textarea></div>
      </div>
      <button type="button" @click="addCardSet" class="add-set-btn">Add Card Set</button>
    </div>

    <!-- Web Links Section -->
    <div class="links-section section-box">
      <h4>Web Links & Manual</h4>
      <div><label for="officialWebsiteUrl">Official Website URL:</label><input type="url" id="officialWebsiteUrl" v-model="form.officialWebsiteUrl" placeholder="https://example.com" /></div>
      <div><label for="manualUrl">Online Manual URL:</label><input type="url" id="manualUrl" v-model="form.manualUrl" placeholder="https://example.com/manual.pdf"/></div>
      <div>
        <label>Other Links:</label>
        <div v-for="(link, index) in form.otherLinks" :key="index" class="other-link-item">
          <input type="text" v-model="link.title" placeholder="Link Title" class="link-title-input"/>
          <input type="url" v-model="link.url" placeholder="https://example.com/other" class="link-url-input"/>
          <button type="button" @click="removeOtherLink(index)" class="remove-link-btn">Remove</button>
        </div>
        <button type="button" @click="addOtherLink" class="add-link-btn">Add Another Link</button>
      </div>
    </div>

    <!-- Crowdfunding Section -->
    <div class="crowdfunding-section section-box">
      <h4>Crowdfunding Details (Optional)</h4>
      <div class="grid-2-col">
        <div><label for="crowdfundingPlatform">Platform:</label><input type="text" id="crowdfundingPlatform" v-model="form.crowdfundingPlatform" /></div>
        <div><label for="crowdfundingUrl">Project URL:</label><input type="url" id="crowdfundingUrl" v-model="form.crowdfundingUrl" /></div>
      </div>
      <div><label for="crowdfundingStatus">Pledge Status:</label><input type="text" id="crowdfundingStatus" v-model="form.crowdfundingStatus" /></div>
    </div>

    <!-- Location Section -->
    <div class="location-section section-box">
      <h4>Storage Location</h4>
      <div class="grid-2-col">
        <div><label for="locationRoom">Room:</label><input type="text" id="locationRoom" v-model="form.locationRoom"/></div>
        <div><label for="locationCupboard">Cupboard/Area:</label><input type="text" id="locationCupboard" v-model="form.locationCupboard"/></div>
        <div><label for="locationShelf">Shelf:</label><input type="text" id="locationShelf" v-model="form.locationShelf"/></div>
      </div>
      <div><label for="locationNotes">Location Notes:</label><input type="text" id="locationNotes" v-model="form.locationNotes"/></div>
    </div>

    <!-- Expansion Fields -->
    <div class="expansion-fields section-box">
      <h4>Expansion Details</h4>
      <label class="checkbox-label"><input type="checkbox" v-model="form.isExpansion"/> Is this an Expansion?</label>
      <div v-if="form.isExpansion">
        <label for="baseGameAppId">Base Game (collection):</label><select id="baseGameAppId" v-model="form.baseGameAppId"><option value="">None</option><option v-for="g in availableBaseGames" :key="g.id" :value="g.id">{{g.name}}</option></select>
        <label for="bggBaseGameIdManual">BGG ID of Base Game:</label><input type="number" id="bggBaseGameIdManual" v-model.number="form.bggBaseGameId"/>
      </div>
    </div>

    <!-- BGG Details & Linked Data -->
    <div class="bgg-details-section section-box">
      <h4>BGG Details & Linked Data</h4>
      <div class="grid-2-col">
        <div><label for="bggId">BGG ID:</label><input type="number" id="bggId" v-model.number="form.bggId"/></div>
        <div><label for="yearPublished">Year Pub.:</label><input type="number" id="yearPublished" v-model.number="form.yearPublished"/></div>
        <div><label for="bggRating">BGG Rating:</label><input type="number" step="0.01" v-model.number="form.bggRating"/></div>
        <div><label for="bggComplexity">BGG Weight:</label><input type="number" step="0.01" v-model.number="form.bggComplexity"/></div>
        <div><label for="minPlayers">Min Players:</label><input type="number" v-model.number="form.minPlayers"/></div>
        <div><label for="maxPlayers">Max Players:</label><input type="number" v-model.number="form.maxPlayers"/></div>
        <div><label for="playingTime">Play Time (min):</label><input type="number" v-model.number="form.playingTime"/></div>
      </div>
      <div><label for="designers">Designers (CSV):</label><input type="text" v-model="form.designersString"/></div>
      <div><label for="publishers">Publishers (CSV):</label><input type="text" v-model="form.publishersString"/></div>
      <div><label for="categories">Categories (CSV):</label><input type="text" v-model="form.categoriesString"/></div>
      <div><label for="mechanics">Mechanics (CSV):</label><input type="text" v-model="form.mechanicsString"/></div>
      <div><label for="bggSubdomains">BGG Subdomains (CSV):</label><input type="text" v-model="form.bggSubdomainsString" /></div>
      <div><label for="bggFamilies">BGG Families (CSV):</label><input type="text" v-model="form.bggFamiliesString" /></div>
    </div>

    <div class="image-section section-box">
      <h4>Images</h4>
      <div><label for="thumbnailUrl">Thumbnail URL:</label><input type="url" v-model="form.thumbnailUrl"/></div>
      <div v-if="form.thumbnailUrl"><img :src="form.thumbnailUrl" alt="Thumbnail" class="form-thumbnail"/></div>
      <div><label for="imageUrl">Image URL:</label><input type="url" v-model="form.imageUrl"/></div>
    </div>

      <div class="form-actions">
        <button type="submit" :disabled="boardGameStore.loading">
          {{ editGameStore.isEditMode ? "Save Changes" : (boardGameStore.loading ? "Adding..." : "Add Game") }}
        </button>
        <button type="button" @click="handleCancel" class="cancel-btn">
          {{ editGameStore.isEditMode ? "Cancel Edit" : "Hide Form" }}
        </button>
      </div>
      <div v-if="formError" class="error">{{ formError }}</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed, onMounted } from "vue";
import { v4 as uuidv4 } from "uuid";
import { useBoardGameStore } from "../stores/boardGameStore";
import { useBggFormStore } from "../stores/bggFormStore";
import { useEditGameStore } from "../stores/editGameStore";
import type { BoardGame, OtherLink, CardSet } from "../types";

interface FormExpansionTempData { isExpansionFromBgg?: boolean; bggBaseGameIdFromBgg?: number; }
interface StringArrayFields {
  designersString: string; publishersString: string; categoriesString: string; mechanicsString: string;
  bggSubdomainsString: string; bggFamiliesString: string;
}

const boardGameStore = useBoardGameStore();
const bggFormStore = useBggFormStore();
const editGameStore = useEditGameStore();

const statusOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);

const getInitialFormState = (): Omit<BoardGame, "id"|"playCount"|"lastPlayedDate"|"bggVideoLinks"> & FormExpansionTempData & StringArrayFields & { id?: string } => ({
  name:"", description:"", version:"", bggId:undefined, status:"", bggRating:undefined, bggComplexity:undefined, yearPublished:undefined,
  minPlayers:undefined, maxPlayers:undefined, playingTime:undefined, thumbnailUrl:"", imageUrl:"",
  isExpansion:false, baseGameAppId:"", bggBaseGameId:undefined, bggExpansionIds:[],
  designers:[], publishers:[], categories:[], mechanics:[], plays:[],
  locationRoom:"", locationCupboard:"", locationShelf:"", locationNotes:"",
  officialWebsiteUrl:"", otherLinks:[], crowdfundingPlatform:"", crowdfundingUrl:"", crowdfundingStatus:"",
  bggSubdomains: [], bggFamilies: [], manualUrl: "", cardSets: [],
  isExpansionFromBgg:false, bggBaseGameIdFromBgg:undefined,
  designersString:"", publishersString:"", categoriesString:"", mechanicsString:"",
  bggSubdomainsString: "", bggFamiliesString: "",
});
const form = reactive(getInitialFormState());
const populatedBggId = ref<number|undefined>(undefined); const formError = ref<string|null>(null);
const availableBaseGames = computed(()=>boardGameStore.games.filter(g=>!g.isExpansion && g.id !== form.id));
const arrayToString = (arr?:string[])=>arr?.join(", ")||"";
const stringToArray=(s?:string)=>s?s.split(",").map(i=>i.trim()).filter(i=>i):[];

watch(() => editGameStore.gameToEdit, (gameToEdit) => {
  if (gameToEdit && editGameStore.isEditMode) {
    Object.assign(form, getInitialFormState());
    form.id = gameToEdit.id; form.name = gameToEdit.name; form.description = gameToEdit.description || "";
    form.version = gameToEdit.version || ""; form.status = gameToEdit.status || "";
    form.bggId = gameToEdit.bggId; form.yearPublished = gameToEdit.yearPublished;
    form.bggRating = gameToEdit.bggRating; form.bggComplexity = gameToEdit.bggComplexity;
    form.minPlayers = gameToEdit.minPlayers; form.maxPlayers = gameToEdit.maxPlayers;
    form.playingTime = gameToEdit.playingTime; form.thumbnailUrl = gameToEdit.thumbnailUrl || "";
    form.imageUrl = gameToEdit.imageUrl || ""; form.officialWebsiteUrl = gameToEdit.officialWebsiteUrl || "";
    form.manualUrl = gameToEdit.manualUrl || ""; form.locationRoom = gameToEdit.locationRoom || "";
    form.locationCupboard = gameToEdit.locationCupboard || ""; form.locationShelf = gameToEdit.locationShelf || "";
    form.locationNotes = gameToEdit.locationNotes || "";
    form.crowdfundingPlatform = gameToEdit.crowdfundingPlatform || ""; form.crowdfundingUrl = gameToEdit.crowdfundingUrl || "";
    form.crowdfundingStatus = gameToEdit.crowdfundingStatus || "";
    form.isExpansion = gameToEdit.isExpansion || false; form.baseGameAppId = gameToEdit.baseGameAppId || "";
    form.bggBaseGameId = gameToEdit.bggBaseGameId;
    form.bggExpansionIds = gameToEdit.bggExpansionIds ? JSON.parse(JSON.stringify(gameToEdit.bggExpansionIds)) : [];
    form.otherLinks = gameToEdit.otherLinks ? JSON.parse(JSON.stringify(gameToEdit.otherLinks)) : [];
    form.cardSets = gameToEdit.cardSets ? JSON.parse(JSON.stringify(gameToEdit.cardSets)) : [];
    form.plays = gameToEdit.plays ? JSON.parse(JSON.stringify(gameToEdit.plays)) : [];
    form.designersString = arrayToString(gameToEdit.designers); form.publishersString = arrayToString(gameToEdit.publishers);
    form.categoriesString = arrayToString(gameToEdit.categories); form.mechanicsString = arrayToString(gameToEdit.mechanics);
    form.bggSubdomainsString = arrayToString(gameToEdit.bggSubdomains); form.bggFamiliesString = arrayToString(gameToEdit.bggFamilies);
    form.isExpansionFromBgg = false; form.bggBaseGameIdFromBgg = undefined; populatedBggId.value = undefined;
  } else if (!editGameStore.isEditMode) {
     Object.assign(form, getInitialFormState());
  }
}, { immediate: true });

watch(()=>bggFormStore.bggGameDataForForm,(newData)=>{ if(newData && !editGameStore.isEditMode){
    Object.assign(form, getInitialFormState());
    form.name=newData.name||""; form.description = newData.description || "";
    form.version=newData.yearPublished?.toString()||""; form.bggId=newData.bggId;
    form.officialWebsiteUrl=newData.officialWebsiteFromBgg||"";
    form.bggRating=newData.bggRating;form.bggComplexity=newData.bggComplexity;form.yearPublished=newData.yearPublished;
    form.minPlayers=newData.minPlayers;form.maxPlayers=newData.maxPlayers;form.playingTime=newData.playingTime;
    form.thumbnailUrl=newData.thumbnailUrl||"";form.imageUrl=newData.imageUrl||"";
    form.isExpansion=newData.isExpansionFromBgg||false;form.bggBaseGameId=newData.bggBaseGameIdFromBgg;
    form.designersString=arrayToString(newData.designersFromBgg);form.publishersString=arrayToString(newData.publishersFromBgg);
    form.categoriesString=arrayToString(newData.categoriesFromBgg);form.mechanicsString=arrayToString(newData.mechanicsFromBgg);
    form.bggSubdomainsString=arrayToString(newData.bggSubdomainsFromBgg);form.bggFamiliesString=arrayToString(newData.bggFamiliesFromBgg);
    form.isExpansionFromBgg=newData.isExpansionFromBgg;form.bggBaseGameIdFromBgg=newData.bggBaseGameIdFromBgg;
    populatedBggId.value=newData.bggId;
    // bggFormStore.clearBggGameData(); // Keep data for video display until submit/cancel
}},{deep:true});

const addOtherLink=()=>{if(!form.otherLinks)form.otherLinks=[];form.otherLinks.push({title:"",url:""})};
const removeOtherLink=(idx:number)=>{form.otherLinks?.splice(idx,1)};
const addCardSet = () => { if (!form.cardSets) form.cardSets = []; form.cardSets.push({ id: uuidv4(), categoryName: "", cardCount: 0, sleevedCount: 0 }); };
const removeCardSet = (index: number) => { form.cardSets?.splice(index, 1); };
const clearBggLink=()=>{populatedBggId.value=undefined;form.bggId=undefined;form.isExpansionFromBgg=false;form.bggBaseGameIdFromBgg=undefined; bggFormStore.clearBggGameData();};

const handleSubmit=async()=>{
  formError.value = null; if (!form.name.trim()) { formError.value="Name required."; return; }
  boardGameStore.error = null;
  const gameDataToSubmit: Partial<BoardGame> = { ...form, id: editGameStore.isEditMode ? form.id : undefined };
  gameDataToSubmit.designers=stringToArray(form.designersString); gameDataToSubmit.publishers=stringToArray(form.publishersString);
  gameDataToSubmit.categories=stringToArray(form.categoriesString); gameDataToSubmit.mechanics=stringToArray(form.mechanicsString);
  gameDataToSubmit.bggSubdomains=stringToArray(form.bggSubdomainsString); gameDataToSubmit.bggFamilies=stringToArray(form.bggFamiliesString);
  delete (gameDataToSubmit as any).isExpansionFromBgg; delete (gameDataToSubmit as any).bggBaseGameIdFromBgg;
  delete (gameDataToSubmit as any).designersString; delete (gameDataToSubmit as any).publishersString;
  delete (gameDataToSubmit as any).categoriesString; delete (gameDataToSubmit as any).mechanicsString;
  delete (gameDataToSubmit as any).bggSubdomainsString; delete (gameDataToSubmit as any).bggFamiliesString;
  if(!form.isExpansion){gameDataToSubmit.baseGameAppId=undefined;gameDataToSubmit.bggBaseGameId=undefined;}
  gameDataToSubmit.otherLinks = form.otherLinks?.filter(link => link.url.trim() !== "") || [];
  gameDataToSubmit.cardSets = form.cardSets?.filter(cs => cs.categoryName.trim() && cs.cardCount >= 0) || [];

  let success = false;
  if (editGameStore.isEditMode && gameDataToSubmit.id) {
    success = await boardGameStore.updateGame(gameDataToSubmit.id, gameDataToSubmit);
  } else {
    gameDataToSubmit.plays = [];
    success = await boardGameStore.addGame(gameDataToSubmit as Omit<BoardGame,"id">);
  }

  if(success){
    Object.assign(form, getInitialFormState()); populatedBggId.value = undefined;
    editGameStore.clearGameToEditAndHideForm();
    bggFormStore.clearBggGameData(); // Clear BGG transient data on successful save
  } else { formError.value = boardGameStore.error || "Operation failed."; }
};
const handleCancel = () => {
  Object.assign(form, getInitialFormState());
  editGameStore.clearGameToEditAndHideForm();
  bggFormStore.clearBggGameData(); // Also clear BGG transient data on cancel
};

onMounted(() => {
  if (!editGameStore.isEditMode && !bggFormStore.bggGameDataForForm) {
    Object.assign(form, getInitialFormState());
  }
});
</script>
<style scoped>
.form-container { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; background: #f9f9f9; border-radius: 5px; }
.editing-info { background-color: #fff3cd; border: 1px solid #ffeeba; padding: 5px 10px; margin-bottom:10px; border-radius:3px; }
.form-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
.cancel-btn { background-color: #6c757d; color:white; border:none; }
.add-game-form{padding:15px;border:1px solid #ccc;border-radius:5px;background-color:#f9f9f9;margin-bottom:20px}
.section-box{border:1px solid #add8e6;padding:10px;margin-bottom:15px;border-radius:4px;background-color:#f7fcff}
.section-box h4{margin-top:0;margin-bottom:10px;color:#0056b3;border-bottom:1px solid #add8e6;padding-bottom:5px}
.section-box > div, .add-game-form > div:not(.section-box):not(.grid-2-col) {margin-bottom:10px}
label{display:block;margin-bottom:5px;font-weight:700}
input,textarea,select{width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;border-radius:3px}
.grid-2-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px}
button[type=submit]{padding:10px 15px;background-color:#007bff;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-top:15px}
.card-set-item h5 button.remove-set-btn { font-size:0.8em; padding: 2px 5px;}
button.add-set-btn { font-size:0.9em; padding: 5px 10px;}
.bgg-videos-section ul { list-style: disc; margin-left: 20px; }
.bgg-videos-section li a { text-decoration: underline; color: #0056b3; }
.form-note { font-size: 0.85em; color: #555; margin-top: 5px; }
</style>
