<template>
  <div v-if="editGameStore.showForm" class="form-container">
    <form @submit.prevent="handleSubmit" class="add-game-form">
      <h2>{{ editGameStore.isEditMode ? "Edit Board Game" : "Add New Board Game" }}</h2>
      <!-- ... other form sections (Core Info, BGG Details, Links, Location, etc.) ... -->

      <details class="form-section">
        <summary>Game Attachments (Printables, Rules Variants, etc.)</summary>
        <div class="attachments-section section-box-inner">
          <div class="add-attachment-area">
            <h4>Add New Attachment</h4>
            <div><label for="newAttachmentTitle">Attachment Title:</label><input type="text" id="newAttachmentTitle" v-model="newAttachment.title" placeholder="e.g., Custom Scenario PDF, Rules Summary" /></div>
            <div><label for="newAttachmentNotes">Attachment Notes (Optional):</label><textarea id="newAttachmentNotes" v-model="newAttachment.notes" rows="2"></textarea></div>
            <div>
              <label for="attachmentFileUploadInput">Select File:</label>
              <input type="file" id="attachmentFileUploadInput" @change="stageAttachmentFile" ref="attachmentFileInputRef" />
            </div>
            <button
              type="button"
              @click="handleAttachmentUploadAndAddToList"
              :disabled="!stagedAttachmentFile || !newAttachment.title.trim() || isUploadingAttachment"
              class="upload-attachment-btn"
            >
              {{ isUploadingAttachment ? "Uploading..." : "Upload & Add Attachment" }}
            </button>
            <p v-if="attachmentUploadError" class="error">{{ attachmentUploadError }}</p>
          </div>

          <div v-if="form.attachments && form.attachments.length > 0" class="current-attachments-list">
            <h5>Current Attachments:</h5>
            <ul>
              <li v-for="(attachment, index) in form.attachments" :key="attachment.id" class="attachment-item">
                <div class="attachment-details">
                  <strong>{{ attachment.title }}</strong>
                  <a :href="attachment.fileUrl" target="_blank" rel="noopener noreferrer">({{ attachment.originalName }})</a>
                  <span class="file-type">[{{ attachment.fileType || "unknown" }}]</span>
                  <p v-if="attachment.notes" class="attachment-item-notes">Notes: {{ attachment.notes }}</p>
                  <p class="attachment-item-date">Added: {{ formatDate(attachment.uploadedAt) }}</p>
                </div>
                <button type="button" @click="removeAttachment(index)" class="remove-attachment-btn">Remove</button>
              </li>
            </ul>
          </div>
          <p v-else>No attachments for this game yet.</p>
        </div>
      </details>

      <!-- ... other sections ... -->
      <div class="form-actions">
        <button type="submit" :disabled="boardGameStore.loading || isUploadingImage || isUploadingAttachment">
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
import type { BoardGame, OtherLink, CardSet, BggVideoLink, BggReimplementation, GameAttachment } from "../types";

interface FormExpansionTempData { isExpansionFromBgg?: boolean; bggBaseGameIdFromBgg?: number; }
interface StringArrayFields {
  designersString: string; publishersString: string; categoriesString: string; mechanicsString: string;
  bggSubdomainsString: string; bggFamiliesString: string;
}

const boardGameStore = useBoardGameStore(); const bggFormStore = useBggFormStore(); const editGameStore = useEditGameStore();
const statusOptions = ref(["Owned","Wishlist","Data Tracking Only","Sold"]); // Example

const getInitialFormState = (): Omit<BoardGame, "id"|"playCount"|"lastPlayedDate"> & FormExpansionTempData & StringArrayFields & { id?: string } => ({
  name:"", description:"", version:"", bggId:undefined, status:"", bggRating:undefined, bggComplexity:undefined, yearPublished:undefined,
  minPlayers:undefined, maxPlayers:undefined, playingTime:undefined, thumbnailUrl:"", imageUrl:"",userImageUrls: [],
  isExpansion:false, baseGameAppId:"", bggBaseGameId:undefined, bggExpansionIds:[],
  designers:[], publishers:[], categories:[], mechanics:[], plays:[],
  locationRoom:"", locationCupboard:"", locationShelf:"", locationNotes:"",
  officialWebsiteUrl:"", otherLinks:[], crowdfundingPlatform:"", crowdfundingUrl:"", crowdfundingStatus:"",
  bggSubdomains: [], bggFamilies: [], onlineManualUrl: "", localManualUrl: "", bggVideoLinks: [], bggReimplementations: [],
  attachments: [], // Initialize attachments
  isExpansionFromBgg:false, bggBaseGameIdFromBgg:undefined,
  designersString:"", publishersString:"", categoriesString:"", mechanicsString:"",
  bggSubdomainsString: "", bggFamiliesString: "",
});
const form = reactive(getInitialFormState());
const populatedBggId = ref<number|undefined>(undefined); const formError = ref<string|null>(null);
const isUploadingImage = ref(false); /* ... image upload error ref ...*/

// New state for attachment upload
const newAttachment = reactive({ title: "", notes: "" });
const stagedAttachmentFile = ref<File | null>(null);
const attachmentFileInputRef = ref<HTMLInputElement | null>(null);
const isUploadingAttachment = ref(false);
const attachmentUploadError = ref<string | null>(null);

const arrayToString = (arr?:string[])=>arr?.join(", ")||"";
const stringToArray=(s?:string)=>s?s.split(",").map(i=>i.trim()).filter(i=>i):[];

watch(() => editGameStore.gameToEdit, (gameToEdit) => {
  if (gameToEdit && editGameStore.isEditMode) {
    Object.assign(form, getInitialFormState());
    // Populate all fields, including attachments
    for (const key in form) {
      if (gameToEdit.hasOwnProperty(key)) {
        const typedKey = key as keyof BoardGame;
        if (Array.isArray((form as any)[typedKey]) && Array.isArray(gameToEdit[typedKey])) {
          (form as any)[typedKey] = JSON.parse(JSON.stringify(gameToEdit[typedKey]));
        } else {
          (form as any)[typedKey] = gameToEdit[typedKey];
        }
      }
    }
    form.id = gameToEdit.id; // Ensure ID is set for edit
    // String array fields population
    form.designersString = arrayToString(gameToEdit.designers); /* ... etc for all stringArrayFields ... */
    form.publishersString = arrayToString(gameToEdit.publishers);
    form.categoriesString = arrayToString(gameToEdit.categories);
    form.mechanicsString = arrayToString(gameToEdit.mechanics);
    form.bggSubdomainsString = arrayToString(gameToEdit.bggSubdomains);
    form.bggFamiliesString = arrayToString(gameToEdit.bggFamilies);

  } else if (!editGameStore.isEditMode) { Object.assign(form, getInitialFormState()); }
}, { immediate: true, deep:true });

watch(()=>bggFormStore.bggGameDataForForm,(newData)=>{ if(newData && !editGameStore.isEditMode){
    Object.assign(form, getInitialFormState());
    form.name=newData.name||""; /* ... (rest of BGG data population) ... */
    // attachments are not populated from BGG
    populatedBggId.value=newData.bggId;
}},{deep:true});

const stageAttachmentFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  stagedAttachmentFile.value = (target.files && target.files.length > 0) ? target.files[0] : null;
  attachmentUploadError.value = null;
};

const handleAttachmentUploadAndAddToList = async () => {
  if (!stagedAttachmentFile.value || !newAttachment.title.trim()) {
    attachmentUploadError.value = "Attachment Title and File are required."; return;
  }
  isUploadingAttachment.value = true; attachmentUploadError.value = null;
  const formData = new FormData();
  formData.append("gameAttachmentFile", stagedAttachmentFile.value);

  try {
    const response = await fetch("/api/files/upload/attachment", { method: "POST", body: formData });
    if (!response.ok) { const errData = await response.json().catch(()=>({})); throw new Error(errData.message || "Attachment upload failed."); }
    const result = await response.json();

    if (!form.attachments) form.attachments = [];
    form.attachments.push({
      id: uuidv4(), title: newAttachment.title, notes: newAttachment.notes,
      fileUrl: result.fileUrl, originalName: result.originalName, fileType: result.fileType,
      uploadedAt: new Date().toISOString(),
    });
    newAttachment.title = ""; newAttachment.notes = ""; stagedAttachmentFile.value = null;
    if (attachmentFileInputRef.value) attachmentFileInputRef.value.value = "";
  } catch (err: any) { attachmentUploadError.value = err.message; }
  finally { isUploadingAttachment.value = false; }
};

const removeAttachment = (index: number) => { form.attachments?.splice(index, 1); };

const handleSubmit=async()=>{
  formError.value = null; if (!form.name.trim()) { formError.value="Name is required."; return; }
  boardGameStore.error = null; const gameDataToSubmit: Partial<BoardGame> = { ...form };
  gameDataToSubmit.designers=stringToArray(form.designersString); /* ... convert all string arrays ... */
  gameDataToSubmit.attachments = form.attachments || [];

  delete (gameDataToSubmit as any).isExpansionFromBgg; delete (gameDataToSubmit as any).bggBaseGameIdFromBgg;
  delete (gameDataToSubmit as any).designersString; /* ... delete all string versions ... */

  let success = false;
  if (editGameStore.isEditMode && form.id) { success = await boardGameStore.updateGame(form.id, gameDataToSubmit); }
  else { gameDataToSubmit.plays = []; success = await boardGameStore.addGame(gameDataToSubmit as Omit<BoardGame,"id">); }

  if(success){ Object.assign(form, getInitialFormState()); populatedBggId.value = undefined; editGameStore.clearGameToEditAndHideForm(); bggFormStore.clearBggGameData(); }
  else { formError.value = boardGameStore.error || "Operation failed."; }
};
const handleCancel = () => { Object.assign(form, getInitialFormState()); editGameStore.clearGameToEditAndHideForm(); bggFormStore.clearBggGameData(); };
const formatDate = (ds?:string) => ds ? new Date(ds).toLocaleDateString() : "";
// Other form methods (addOtherLink, removeOtherLink, addCardSet, removeCardSet, handleImageFileUpload, removeUserImage, removeBggVideoLink, clearBggLink) should be present
</script>
<style scoped>
/* ... (existing styles including .section-box, .grid-2-col, .form-actions, .error) ... */
.attachments-section .add-attachment-area { border: 1px dashed #ccc; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
.attachments-section .add-attachment-area h4 { margin-top:0; }
.attachments-section input[type="file"] { margin-top: 5px; margin-bottom: 10px; }
.upload-attachment-btn { background-color: #5cb85c; color:white; border:none; padding: 8px 12px; border-radius:3px; cursor:pointer; }
.upload-attachment-btn:disabled { background-color: #aaa; }

.current-attachments-list h5 { margin-top:0; margin-bottom:10px; }
.current-attachments-list ul { list-style: none; padding: 0; }
.attachment-item {
  background-color: #f9f9f9; border: 1px solid #ddd; padding: 10px;
  margin-bottom: 8px; border-radius: 3px;
}
.attachment-details strong { font-size: 1.05em; }
.attachment-details a { color: #0056b3; text-decoration: underline; margin: 0 5px; }
.file-type { font-size: 0.8em; color: #777; }
.attachment-item-notes, .attachment-item-date { font-size:0.85em; color:#555; margin-top:3px; }
.remove-attachment-btn {
  background-color: #e74c3c; color:white; border:none; padding: 4px 8px;
  font-size:0.8em; border-radius:3px; cursor:pointer; float:right; margin-top:-5px;
}
</style>
