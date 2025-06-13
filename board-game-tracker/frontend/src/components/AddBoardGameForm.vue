<template>
  <div v-if="editGameStore.showForm" class="form-container">
    <form @submit.prevent="handleSubmit" class="add-game-form">
      <h2>{{ editGameStore.isEditMode ? "Edit Board Game" : "Add New Board Game" }}</h2>

      <div v-if="editGameStore.isEditMode && form.id" class="editing-info">
        <p>Editing: <strong>{{ form.name || "Game ID: " + form.id }}</strong></p>
      </div>

      <div v-if="populatedBggId && !editGameStore.isEditMode" class="bgg-info">
        <p>Populated from BGG ID: {{ populatedBggId }} <button type="button" @click="clearBggLink" class="clear-bgg-link-btn">X</button></p>
        <p v-if="form.isExpansionFromBgg" class="bgg-expansion-info">BGG: This is an expansion for game ID {{ form.bggBaseGameIdFromBgg }}.</p>
        <div v-if="bggFormStore.bggGameDataForForm?.bggReimplementationsFromBgg && bggFormStore.bggGameDataForForm.bggReimplementationsFromBgg.length > 0" class="bgg-reimpl-info">
          <p><strong>BGG Suggests Reimplementations:</strong></p>
          <ul>
            <li v-for="reimpl in bggFormStore.bggGameDataForForm.bggReimplementationsFromBgg" :key="reimpl.bggId">
              {{ reimpl.name }} (BGG ID: {{ reimpl.bggId }})
            </li>
          </ul>
        </div>
      </div>

      <details open class="form-section">
        <summary>Core Information</summary>
        <div class="section-box-inner">
            <div><label for="name">Name:</label><input id="name" type="text" v-model="form.name" required /></div>
            <div><label for="description">Description:</label><textarea id="description" v-model="form.description" rows="3" required></textarea></div>
            <div><label for="version">Version/Edition:</label><input id="version" type="text" v-model="form.version" /></div>
            <div>
            <label for="status">Ownership Status:</label>
            <select id="status" v-model="form.status">
                <option value="">Select Status</option>
                <option v-for="sOpt in statusOptions" :key="sOpt" :value="sOpt">{{ sOpt }}</option>
            </select>
            </div>
        </div>
      </details>

      <details class="form-section">
        <summary>Web Links, Manuals & BGG Videos</summary>
        <div class="links-section section-box-inner">
          <div><label for="officialWebsiteUrl">Official Website URL:</label><input id="officialWebsiteUrl" type="url" v-model="form.officialWebsiteUrl" placeholder="https://example.com" /></div>

          <div><label for="onlineManualUrl">Online Manual URL (link to existing PDF, etc.):</label><input id="onlineManualUrl" type="url" v-model="form.onlineManualUrl" placeholder="https://example.com/manual.pdf"/></div>

          <div class="manual-upload-area">
            <label for="manualUploadInput">Upload Local Manual (PDF, DOC, TXT - max 20MB):</label>
            <input
              type="file"
              id="manualUploadInput"
              accept=".pdf,.doc,.docx,.txt"
              @change="handleManualFileUpload"
              :disabled="isUploadingManual"
            />
            <p v-if="isUploadingManual">Uploading manual...</p>
            <p v-if="manualUploadError" class="error">{{ manualUploadError }}</p>
            <div v-if="form.localManualUrl" class="manual-preview-item">
              <span>Uploaded: <a :href="form.localManualUrl" target="_blank">{{ form.localManualUrl.split("/").pop() }}</a></span>
              <button type="button" @click="clearLocalManual" class="remove-link-btn">Remove Uploaded Manual</button>
            </div>
          </div>

          <div><label>Other Links:</label>
            <div v-for="(l,i) in form.otherLinks" :key="i" class="other-link-item"><input v-model="l.title" placeholder="Title"/><input v-model="l.url" placeholder="URL"/><button type="button" @click="removeOtherLink(i)" class="remove-link-btn">X</button></div>
            <button type="button" @click="addOtherLink" class="add-link-btn">+Link</button>
          </div>

          <div v-if="(bggFormStore.bggGameDataForForm?.bggVideosFromBgg?.length && !editGameStore.isEditMode) || (form.bggVideoLinks && form.bggVideoLinks.length > 0)" class="bgg-videos-subsection">
            <h5>BGG Video Links (Review & Save)</h5>
            <ul v-if="form.bggVideoLinks && form.bggVideoLinks.length > 0"><li v-for="(v,ix) in form.bggVideoLinks" :key="ix" class="video-link-item"><a :href="v.url" target="_blank">{{v.title}}</a><button @click="removeBggVideoLink(ix)" class="remove-video-btn">X</button></li></ul>
            <p v-else-if="!editGameStore.isEditMode">No video links suggested by BGG.</p><p v-else>No BGG video links saved.</p>
          </div>
        </div>
      </details>

      <details class="form-section">
        <summary>BGG Details & Linked Data</summary>
        <div class="bgg-details-section section-box-inner">
          <div class="grid-2-col">
            <div><label for="bggId">BGG ID:</label><input id="bggId" type="number" v-model.number="form.bggId"/></div>
            <div><label for="yearPublished">Year Pub.:</label><input id="yearPublished" type="number" v-model.number="form.yearPublished"/></div>
            <div><label for="bggRating">BGG Rating:</label><input id="bggRating" type="number" step="0.01" v-model.number="form.bggRating"/></div>
            <div><label for="bggComplexity">BGG Weight:</label><input id="bggComplexity" type="number" step="0.01" v-model.number="form.bggComplexity"/></div>
            <div><label for="minPlayers">Min Players:</label><input id="minPlayers" type="number" v-model.number="form.minPlayers"/></div>
            <div><label for="maxPlayers">Max Players:</label><input id="maxPlayers" type="number" v-model.number="form.maxPlayers"/></div>
            <div><label for="playingTime">Play Time (min):</label><input id="playingTime" type="number" v-model.number="form.playingTime"/></div>
          </div>
          <div><label for="designers">Designers (CSV):</label><input id="designers" type="text" v-model="form.designersString"/></div>
          <div><label for="publishers">Publishers (CSV):</label><input id="publishers" type="text" v-model="form.publishersString"/></div>
          <div><label for="categories">Categories (CSV):</label><input id="categories" type="text" v-model="form.categoriesString"/></div>
          <div><label for="mechanics">Mechanics (CSV):</label><input id="mechanics" type="text" v-model="form.mechanicsString"/></div>
          <div><label for="bggSubdomains">BGG Subdomains (CSV):</label><input id="bggSubdomains" type="text" v-model="form.bggSubdomainsString" /></div>
          <div><label for="bggFamilies">BGG Families (CSV):</label><input id="bggFamilies" type="text" v-model="form.bggFamiliesString" /></div>
        </div>
      </details>

      <details class="form-section">
        <summary>Your Images & External Image URLs</summary>
        <div class="user-images-section section-box-inner">
            <h4>Your Images</h4>
            <div class="image-upload-area">
                <label for="imageUploadInput" class="image-upload-label">Upload Game Images (PNG, JPG, GIF - max 5MB):</label>
                <input type="file" id="imageUploadInput" accept="image/png, image/jpeg, image/gif" @change="handleImageFileUpload" multiple :disabled="isUploadingImage"/>
                <p v-if="isUploadingImage">Uploading image(s)...</p> <p v-if="imageUploadError" class="error">{{ imageUploadError }}</p>
            </div>
            <div v-if="form.userImageUrls && form.userImageUrls.length > 0" class="uploaded-images-preview">
                <h5>Uploaded Images:</h5>
                <div v-for="(imageUrl, index) in form.userImageUrls" :key="index" class="img-preview-item">
                <img :src="imageUrl" :alt="`User image ${index + 1}`" />
                <button type="button" @click="removeUserImage(index)" class="remove-img-btn" title="Remove this image">X</button>
                </div>
            </div>
        </div>
        <div class="image-section section-box-inner">
            <h4>External Image URLs (e.g., from BGG)</h4>
            <div><label for="thumbnailUrl">Thumbnail URL (BGG):</label><input id="thumbnailUrl" type="url" v-model="form.thumbnailUrl"/></div>
            <div v-if="form.thumbnailUrl"><img :src="form.thumbnailUrl" alt="Thumbnail" class="form-thumbnail"/></div>
            <div><label for="imageUrl">Main Image URL (BGG):</label><input id="imageUrl" type="url" v-model="form.imageUrl"/></div>
        </div>
      </details>

      <details class="form-section">
        <summary>Storage Location</summary>
        <div class="location-section section-box-inner">
            <div class="grid-2-col">
                <div><label for="locationRoom">Room:</label><input id="locationRoom" type="text" v-model="form.locationRoom"/></div>
                <div><label for="locationCupboard">Cupboard/Area:</label><input id="locationCupboard" type="text" v-model="form.locationCupboard"/></div>
                <div><label for="locationShelf">Shelf:</label><input id="locationShelf" type="text" v-model="form.locationShelf"/></div>
            </div>
            <div><label for="locationNotes">Location Notes:</label><input id="locationNotes" type="text" v-model="form.locationNotes"/></div>
        </div>
      </details>

      <details class="form-section">
        <summary>Expansion Details</summary>
        <div class="expansion-fields section-box-inner">
            <label class="checkbox-label"><input type="checkbox" v-model="form.isExpansion"/> Is this an Expansion?</label>
            <div v-if="form.isExpansion">
                <label for="baseGameAppId">Base Game (collection):</label><select id="baseGameAppId" v-model="form.baseGameAppId"><option value="">None</option><option v-for="g in availableBaseGames" :key="g.id" :value="g.id">{{g.name}}</option></select>
                <label for="bggBaseGameIdManual">BGG ID of Base Game:</label><input id="bggBaseGameIdManual" type="number" v-model.number="form.bggBaseGameId"/>
            </div>
        </div>
      </details>

      <details class="form-section">
        <summary>Crowdfunding Details</summary>
        <div class="crowdfunding-section section-box-inner">
            <div class="grid-2-col">
                <div><label for="crowdfundingPlatform">Platform:</label><input id="crowdfundingPlatform" type="text" v-model="form.crowdfundingPlatform" /></div>
                <div><label for="crowdfundingUrl">Project URL:</label><input id="crowdfundingUrl" type="url" v-model="form.crowdfundingUrl" /></div>
            </div>
            <div><label for="crowdfundingStatus">Pledge Status:</label><input id="crowdfundingStatus" type="text" v-model="form.crowdfundingStatus" /></div>
        </div>
      </details>

      <details class="form-section" open>
        <summary>Card Sleeve Inventory</summary>
        <div class="card-sleeve-section section-box-inner">
            <div v-for="(cardSet, index) in form.cardSets" :key="cardSet.id" class="card-set-item">
                <h5>Set {{ index + 1 }} <button type="button" @click="removeCardSet(index)" class="remove-set-btn">Remove Set</button></h5>
                <div class="grid-2-col">
                <div><label :for="\`cs-cat-\${index}\`">Category Name:</label><input :id="\`cs-cat-\${index}\`" type="text" v-model="cardSet.categoryName" required /></div>
                <div><label :for="\`cs-size-\${index}\`">Card Size:</label><input :id="\`cs-size-\${index}\`" type="text" v-model="cardSet.cardSize" /></div>
                <div><label :for="\`cs-count-\${index}\`">Total Cards:</label><input :id="\`cs-count-\${index}\`" type="number" v-model.number="cardSet.cardCount" required min="0" /></div>
                <div><label :for="\`cs-sleeved-\${index}\`">Cards Sleeved:</label><input :id="\`cs-sleeved-\${index}\`" type="number" v-model.number="cardSet.sleevedCount" min="0" /></div>
                </div>
                <div><label :for="\`cs-notes-\${index}\`">Sleeve Notes:</label><textarea :id="\`cs-notes-\${index}\`" v-model="cardSet.sleeveNotes" rows="2"></textarea></div>
            </div>
            <button type="button" @click="addCardSet" class="add-set-btn">Add Card Set</button>
        </div>
      </details>

      <div class="form-actions">
        <button type="submit" :disabled="boardGameStore.loading || isUploadingImage || isUploadingManual">
          {{ editGameStore.isEditMode ? "Save Changes" : "Add Game" }}
        </button>
        <button type="button" @click="handleCancel" class="cancel-btn">Cancel</button>
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
import type { BoardGame, OtherLink, CardSet, BggVideoLink, BggReimplementation } from "../types";

interface FormExpansionTempData { isExpansionFromBgg?: boolean; bggBaseGameIdFromBgg?: number; }
interface StringArrayFields {
  designersString: string; publishersString: string; categoriesString: string; mechanicsString: string;
  bggSubdomainsString: string; bggFamiliesString: string;
}

const boardGameStore = useBoardGameStore(); const bggFormStore = useBggFormStore(); const editGameStore = useEditGameStore();
const statusOptions = ref(["Owned","Being Shipped","Preordered","Backed on Crowdfunding","Wishlist","Data Tracking Only","Sold"]);

const getInitialFormState = (): Omit<BoardGame, "id"|"playCount"|"lastPlayedDate"> & FormExpansionTempData & StringArrayFields & { id?: string } => ({
  name:"", description:"", version:"", bggId:undefined, status:"", bggRating:undefined, bggComplexity:undefined, yearPublished:undefined,
  minPlayers:undefined, maxPlayers:undefined, playingTime:undefined, thumbnailUrl:"", imageUrl:"",userImageUrls: [],
  isExpansion:false, baseGameAppId:"", bggBaseGameId:undefined, bggExpansionIds:[],
  designers:[], publishers:[], categories:[], mechanics:[], plays:[],
  locationRoom:"", locationCupboard:"", locationShelf:"", locationNotes:"",
  officialWebsiteUrl:"", otherLinks:[], crowdfundingPlatform:"", crowdfundingUrl:"", crowdfundingStatus:"",
  bggSubdomains: [], bggFamilies: [], onlineManualUrl: "", localManualUrl: "", cardSets: [], bggVideoLinks: [], bggReimplementations: [],
  isExpansionFromBgg:false, bggBaseGameIdFromBgg:undefined,
  designersString:"", publishersString:"", categoriesString:"", mechanicsString:"",
  bggSubdomainsString: "", bggFamiliesString: "",
});
const form = reactive(getInitialFormState());
const populatedBggId = ref<number|undefined>(undefined); const formError = ref<string|null>(null);
const isUploadingImage = ref(false); const imageUploadError = ref<string | null>(null);
const isUploadingManual = ref(false); const manualUploadError = ref<string | null>(null);

const availableBaseGames = computed(()=>boardGameStore.games.filter(g=>!g.isExpansion && g.id !== form.id));
const arrayToString = (arr?:any[]):string => {if(!arr||arr.length===0)return"";if(typeof arr[0]==="string")return(arr as string[]).join(", ");if(arr[0]&&typeof arr[0].name==="string"&&typeof arr[0].bggId==="number")return(arr as BggReimplementation[]).map(item=>`${item.name} (ID:${item.bggId})`).join("; ");return""};
const stringToArray=(s?:string):string[]=>s?s.split(",").map(i=>i.trim()).filter(i=>i):[];

watch(() => editGameStore.gameToEdit, (gameToEdit) => {
  if (gameToEdit && editGameStore.isEditMode) {
    Object.assign(form, getInitialFormState());
    form.id = gameToEdit.id; form.name = gameToEdit.name; form.description=gameToEdit.description||""; form.version=gameToEdit.version||""; form.status=gameToEdit.status||"";
    form.bggId=gameToEdit.bggId; form.yearPublished=gameToEdit.yearPublished; form.bggRating=gameToEdit.bggRating; form.bggComplexity=gameToEdit.bggComplexity;
    form.minPlayers=gameToEdit.minPlayers; form.maxPlayers=gameToEdit.maxPlayers; form.playingTime=gameToEdit.playingTime;
    form.thumbnailUrl=gameToEdit.thumbnailUrl||""; form.imageUrl=gameToEdit.imageUrl||""; form.userImageUrls=gameToEdit.userImageUrls?[...gameToEdit.userImageUrls]:[];
    form.officialWebsiteUrl=gameToEdit.officialWebsiteUrl||""; form.onlineManualUrl=gameToEdit.onlineManualUrl||""; form.localManualUrl=gameToEdit.localManualUrl||"";
    form.locationRoom=gameToEdit.locationRoom||""; form.locationCupboard=gameToEdit.locationCupboard||""; form.locationShelf=gameToEdit.locationShelf||""; form.locationNotes=gameToEdit.locationNotes||"";
    form.crowdfundingPlatform=gameToEdit.crowdfundingPlatform||""; form.crowdfundingUrl=gameToEdit.crowdfundingUrl||""; form.crowdfundingStatus=gameToEdit.crowdfundingStatus||"";
    form.isExpansion=gameToEdit.isExpansion||false; form.baseGameAppId=gameToEdit.baseGameAppId||""; form.bggBaseGameId=gameToEdit.bggBaseGameId;
    form.bggExpansionIds=gameToEdit.bggExpansionIds?JSON.parse(JSON.stringify(gameToEdit.bggExpansionIds)):[];
    form.otherLinks=gameToEdit.otherLinks?JSON.parse(JSON.stringify(gameToEdit.otherLinks)):[];
    form.cardSets=gameToEdit.cardSets?JSON.parse(JSON.stringify(gameToEdit.cardSets)):[];
    form.plays=gameToEdit.plays?JSON.parse(JSON.stringify(gameToEdit.plays)):[];
    form.bggReimplementations = gameToEdit.bggReimplementations ? JSON.parse(JSON.stringify(gameToEdit.bggReimplementations)) : [];
    form.bggVideoLinks = gameToEdit.bggVideoLinks ? JSON.parse(JSON.stringify(gameToEdit.bggVideoLinks)) : [];
    form.designersString=arrayToString(gameToEdit.designers); form.publishersString=arrayToString(gameToEdit.publishers);
    form.categoriesString=arrayToString(gameToEdit.categories); form.mechanicsString=arrayToString(gameToEdit.mechanics);
    form.bggSubdomainsString=arrayToString(gameToEdit.bggSubdomains); form.bggFamiliesString=arrayToString(gameToEdit.bggFamilies);
    form.isExpansionFromBgg=false; form.bggBaseGameIdFromBgg=undefined; populatedBggId.value=gameToEdit.bggId;
  } else if (!editGameStore.isEditMode) { Object.assign(form, getInitialFormState()); populatedBggId.value = undefined;}
}, { immediate: true, deep:true });

watch(()=>bggFormStore.bggGameDataForForm,(newData)=>{ if(newData && !editGameStore.isEditMode){
    Object.assign(form, getInitialFormState());
    form.name=newData.name||""; form.description = newData.description || "";
    form.version=newData.yearPublished?.toString()||""; form.bggId=newData.bggId;
    form.officialWebsiteUrl=newData.officialWebsiteFromBgg||"";
    // onlineManualUrl is not typically from BGG directly, user may add it. localManualUrl is for uploads.
    form.bggRating=newData.bggRating;form.bggComplexity=newData.bggComplexity;form.yearPublished=newData.yearPublished;
    form.minPlayers=newData.minPlayers;form.maxPlayers=newData.maxPlayers;form.playingTime=newData.playingTime;
    form.thumbnailUrl=newData.thumbnailUrl||"";form.imageUrl=newData.imageUrl||"";
    form.isExpansion=newData.isExpansionFromBgg||false;form.bggBaseGameId=newData.bggBaseGameIdFromBgg;
    form.designersString=arrayToString(newData.designersFromBgg);form.publishersString=arrayToString(newData.publishersFromBgg);
    form.categoriesString=arrayToString(newData.categoriesFromBgg);form.mechanicsString=arrayToString(newData.mechanicsFromBgg);
    form.bggSubdomainsString=arrayToString(newData.bggSubdomainsFromBgg);form.bggFamiliesString=arrayToString(newData.bggFamiliesFromBgg);
    form.bggReimplementations = newData.bggReimplementationsFromBgg ? [...newData.bggReimplementationsFromBgg] : [];
    form.bggVideoLinks = newData.bggVideosFromBgg ? [...newData.bggVideosFromBgg] : [];
    form.isExpansionFromBgg=newData.isExpansionFromBgg;form.bggBaseGameIdFromBgg=newData.bggBaseGameIdFromBgg;
    populatedBggId.value=newData.bggId;
}},{deep:true});

const handleImageFileUpload = async (event: Event) => { /* ... */ isUploadingImage.value = true; imageUploadError.value = null; const files = Array.from((event.target as HTMLInputElement).files || []); for(const file of files){const fd=new FormData(); fd.append("gameImage",file); try{const r=await fetch("/api/images/upload/game",{method:"POST",body:fd}); if(!r.ok){const errD=await r.json().catch(()=>({m:"Server err"}));throw new Error(errD.message)}const res=await r.json();if(res.imageUrl){if(!form.userImageUrls)form.userImageUrls=[];form.userImageUrls.push(res.imageUrl)}}catch(err:any){imageUploadError.value=err.message;break;}}isUploadingImage.value=false;(event.target as HTMLInputElement).value="";};
const removeUserImage = (index: number) => { form.userImageUrls?.splice(index, 1); };
const addOtherLink=()=>{if(!form.otherLinks)form.otherLinks=[];form.otherLinks.push({title:"",url:""})};
const removeOtherLink=(idx:number)=>{form.otherLinks?.splice(idx,1)};
const addCardSet=()=>{if(!form.cardSets)form.cardSets=[];form.cardSets.push({id:uuidv4(),categoryName:"",cardCount:0,sleevedCount:0})};
const removeCardSet=(idx:number)=>{form.cardSets?.splice(idx,1)};
const removeBggVideoLink=(idx:number)=>{form.bggVideoLinks?.splice(idx,1)};
const clearBggLink=()=>{populatedBggId.value=undefined;form.bggId=undefined;form.isExpansionFromBgg=false;form.bggBaseGameIdFromBgg=undefined; bggFormStore.clearBggGameData();};

const handleManualFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  isUploadingManual.value = true; manualUploadError.value = null;
  const formData = new FormData(); formData.append("gameManualFile", file);
  try {
    const response = await fetch("/api/files/upload/manual", { method: "POST", body: formData });
    if (!response.ok) { const errorData = await response.json().catch(()=>({message:"Manual upload server error"})); throw new Error(errorData.message); }
    const result = await response.json();
    form.localManualUrl = result.manualUrl;
  } catch (err:any) { manualUploadError.value = err.message; }
  finally { isUploadingManual.value = false; target.value = ""; }
};
const clearLocalManual = () => { form.localManualUrl = ""; manualUploadError.value = null; };

const handleSubmit=async()=>{
  formError.value = null; if (!form.name.trim()) { formError.value="Name required."; return; }
  boardGameStore.error = null;
  const gameDataToSubmit: Partial<BoardGame> = { ...form };
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
  gameDataToSubmit.userImageUrls = form.userImageUrls || [];
  gameDataToSubmit.bggVideoLinks = form.bggVideoLinks || [];

  let success = false;
  if (editGameStore.isEditMode && gameDataToSubmit.id) { success = await boardGameStore.updateGame(gameDataToSubmit.id, gameDataToSubmit); }
  else { gameDataToSubmit.plays = []; success = await boardGameStore.addGame(gameDataToSubmit as Omit<BoardGame,"id">); }
  if(success){ Object.assign(form, getInitialFormState()); populatedBggId.value = undefined; editGameStore.clearGameToEditAndHideForm(); bggFormStore.clearBggGameData(); }
  else { formError.value = boardGameStore.error || "Operation failed."; }
};
const handleCancel = () => { Object.assign(form, getInitialFormState()); editGameStore.clearGameToEditAndHideForm(); bggFormStore.clearBggGameData(); };
onMounted(() => { if (!editGameStore.isEditMode && !bggFormStore.bggGameDataForForm) { Object.assign(form, getInitialFormState()); }});
</script>

<style scoped>
/* ... (existing styles) ... */
.form-container { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; background: #f9f9f9; border-radius: 5px; }
.form-section { border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 15px; background-color: #fff; }
.form-section summary { font-weight: bold; padding: 10px; cursor: pointer; background-color: #f0f8ff; border-bottom: 1px solid #e0e0e0; list-style-position: inside; }
.form-section summary:hover { background-color: #e6f2ff; }
.form-section[open] summary { border-bottom: 1px solid #e0e0e0; }
.section-box-inner { padding: 15px; }
.manual-upload-area { margin-top: 10px; padding:10px; border:1px dashed #ccc; border-radius:3px; }
.manual-upload-area input[type="file"] { margin-top: 5px; margin-bottom: 5px; }
.manual-preview-item { display:flex; justify-content:space-between; align-items:center; font-size:0.9em; padding:5px; background-color:#e9f5ff; border-radius:3px; }
.manual-preview-item a { color: #0056b3; text-decoration: underline; }
/* Other styles as before */
</style>
