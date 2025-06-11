<template>
  <form @submit.prevent="handleSubmit" class="add-game-form">
    <h2>Add New Board Game</h2>
    <div v-if="populatedBggId" class="bgg-info">
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

    <button type="submit" :disabled="boardGameStore.loading">Add Game</button>
    <div v-if="formError" class="error">{{ formError }}</div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from "vue";
import { v4 as uuidv4 } from "uuid"; // Import UUID
import { useBoardGameStore } from "../stores/boardGameStore";
import { useBggFormStore } from "../stores/bggFormStore";
import type { BoardGame, OtherLink, CardSet } from "../types"; // Import CardSet

interface FormExpansionTempData { isExpansionFromBgg?: boolean; bggBaseGameIdFromBgg?: number; }
interface StringArrayFields {
  designersString: string; publishersString: string; categoriesString: string; mechanicsString: string;
  bggSubdomainsString: string; bggFamiliesString: string;
}

const boardGameStore = useBoardGameStore(); const bggFormStore = useBggFormStore();
const statusOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);

const initialFormState = (): Omit<BoardGame, "id"|"playCount"|"lastPlayedDate"> & FormExpansionTempData & StringArrayFields => ({
  name:"", description:"", version:"", bggId:undefined, status:"", bggRating:undefined, bggComplexity:undefined, yearPublished:undefined,
  minPlayers:undefined, maxPlayers:undefined, playingTime:undefined, thumbnailUrl:"", imageUrl:"",
  isExpansion:false, baseGameAppId:"", bggBaseGameId:undefined, bggExpansionIds:[],
  designers:[], publishers:[], categories:[], mechanics:[],
  locationRoom:"", locationCupboard:"", locationShelf:"", locationNotes:"",
  officialWebsiteUrl:"", otherLinks:[], crowdfundingPlatform:"", crowdfundingUrl:"", crowdfundingStatus:"",
  bggSubdomains: [], bggFamilies: [], manualUrl: "",
  cardSets: [],
  isExpansionFromBgg:false, bggBaseGameIdFromBgg:undefined,
  designersString:"", publishersString:"", categoriesString:"", mechanicsString:"",
  bggSubdomainsString: "", bggFamiliesString: "",
});
const form = reactive(initialFormState());
const populatedBggId = ref<number|undefined>(undefined); const formError = ref<string|null>(null);
const availableBaseGames = computed(()=>boardGameStore.games.filter(g=>!g.isExpansion && g.id !== (form as any).id));
const arrayToString = (arr?:string[])=>arr?.join(", ")||"";
const stringToArray=(s?:string)=>s?s.split(",").map(i=>i.trim()).filter(i=>i):[];

watch(()=>bggFormStore.bggGameDataForForm,(newData)=>{ if(newData){
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
  // cardSets and manualUrl are not typically populated from BGG data by bggFormStore
  bggFormStore.clearBggGameData();
}},{deep:true});

const addOtherLink=()=>{if(!form.otherLinks)form.otherLinks=[];form.otherLinks.push({title:"",url:""})};
const removeOtherLink=(idx:number)=>{form.otherLinks?.splice(idx,1)};

const addCardSet = () => {
  if (!form.cardSets) form.cardSets = [];
  form.cardSets.push({
    id: uuidv4(),
    categoryName: "",
    cardCount: 0,
    cardSize: "",
    sleevedCount: 0,
    sleeveNotes: ""
  });
};
const removeCardSet = (index: number) => {
  form.cardSets?.splice(index, 1);
};

const clearBggLink=()=>{populatedBggId.value=undefined;form.bggId=undefined;form.isExpansionFromBgg=false;form.bggBaseGameIdFromBgg=undefined;};
const handleSubmit=async()=>{formError.value=null;if(!form.name.trim()){formError.value="Name required.";return}
  boardGameStore.error=null; const gameData:Partial<BoardGame>={...form};
  gameData.designers=stringToArray(form.designersString);gameData.publishers=stringToArray(form.publishersString);
  gameData.categories=stringToArray(form.categoriesString);gameData.mechanics=stringToArray(form.mechanicsString);
  gameData.bggSubdomains=stringToArray(form.bggSubdomainsString);gameData.bggFamilies=stringToArray(form.bggFamiliesString);
  delete (gameData as any).isExpansionFromBgg; delete (gameData as any).bggBaseGameIdFromBgg;
  delete (gameData as any).designersString; delete (gameData as any).publishersString;
  delete (gameData as any).categoriesString; delete (gameData as any).mechanicsString;
  delete (gameData as any).bggSubdomainsString; delete (gameData as any).bggFamiliesString;
  if(!form.isExpansion){gameData.baseGameAppId=undefined;gameData.bggBaseGameId=undefined}
  gameData.otherLinks = gameData.otherLinks?.filter(link => link.url.trim() !== "") || [];
  gameData.cardSets = form.cardSets?.filter(cs => cs.categoryName.trim() && cs.cardCount > 0) || [];

  await boardGameStore.addGame(gameData as Omit<BoardGame,"id">);
  if(boardGameStore.error){formError.value=boardGameStore.error}else{Object.assign(form,initialFormState());populatedBggId.value=undefined}
};
</script>
<style scoped>
.add-game-form{padding:15px;border:1px solid #ccc;border-radius:5px;background-color:#f9f9f9;margin-bottom:20px}
.section-box{border:1px solid #add8e6;padding:10px;margin-bottom:15px;border-radius:4px;background-color:#f7fcff}
.section-box h4{margin-top:0;margin-bottom:10px;color:#0056b3;border-bottom:1px solid #add8e6;padding-bottom:5px}
.section-box > div{margin-bottom:10px}
label{display:block;margin-bottom:5px;font-weight:700}
input,textarea,select{width:100%;padding:8px;box-sizing:border-box;border:1px solid #ddd;border-radius:3px}
.grid-2-col{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px}
button[type=submit]{padding:10px 15px;background-color:#007bff;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-top:15px}
.card-set-item { border: 1px solid #cce5ff; padding: 10px; margin-bottom: 10px; border-radius: 3px; background-color: #fff; }
.card-set-item h5 { margin-top: 0; margin-bottom: 10px; display:flex; justify-content: space-between; align-items: center; }
.remove-set-btn, .add-set-btn { padding: 5px 10px; font-size: 0.9em; border-radius: 3px; cursor: pointer; border: none; color: white; }
.remove-set-btn { background-color: #e74c3c; }
.add-set-btn { background-color: #3498db; margin-top: 5px; }
.other-link-item{display:flex;gap:10px;margin-bottom:5px;align-items:center}
.link-title-input{flex-grow:1} .link-url-input{flex-grow:2}
.remove-link-btn{background-color:#dc3545} .add-link-btn{background-color:#28a745}
</style>
