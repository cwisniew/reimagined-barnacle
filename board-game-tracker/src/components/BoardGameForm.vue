<template>
  <form @submit.prevent="handleSubmit" class="board-game-form">
    <h3>Add New Board Game</h3>

    <fieldset class="form-section">
      <legend>BoardGameGeek Integration</legend>
      <BggSearch @bgg-game-selected="handleBggGameSelected" />

      <div v-if="formData.bggId" class="form-group readonly-bgg-info">
        <label>BGG ID:</label>
        <span>{{ formData.bggId }}</span>
      </div>
      <div v-if="formData.bggYearPublished && formData.bggYearPublished !== 'N/A'" class="form-group readonly-bgg-info">
        <label>Year Published (BGG):</label>
        <span>{{ formData.bggYearPublished }}</span>
      </div>
    </fieldset>

    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" v-model="formData.name" required />
    </div>

    <div class="form-group">
      <label for="storageLocation">Storage Location:</label>
      <input type="text" id="storageLocation" v-model="formData.storageLocation" />
    </div>

    <div class="form-group">
      <label for="manualLink">Manual Link (URL):</label>
      <input type="url" id="manualLink" v-model="formData.manualLink" placeholder="https://example.com" />
    </div>

    <fieldset class="form-fieldset">
      <legend>Cards</legend>
      <div v-for="(card, index) in formData.cards" :key="`card-${index}`" class="dynamic-entry">
        <div class="form-row">
          <div class="form-group-inline">
            <label :for="`card-type-${index}`">Type:</label>
            <input :id="`card-type-${index}`" type="text" v-model="card.type" placeholder="e.g., Standard, Mini" />
          </div>
          <div class="form-group-inline">
            <label :for="`card-count-${index}`">Count:</label>
            <input :id="`card-count-${index}`" type="number" v-model.number="card.count" min="0" placeholder="0" />
          </div>
          <div class="form-group-checkbox">
            <input :id="`card-sleeved-${index}`" type="checkbox" v-model="card.sleeved" />
            <label :for="`card-sleeved-${index}`">Sleeved</label>
          </div>
        </div>
        <button type="button" @click="removeCardEntry(index)" class="btn btn-remove">Remove Card</button>
      </div>
      <button type="button" @click="addCardEntry" class="btn btn-add">Add Card Type</button>
    </fieldset>

    <fieldset class="form-fieldset">
      <legend>Expansions</legend>
      <div v-for="(expansion, index) in formData.expansions" :key="`expansion-${index}`" class="dynamic-entry">
        <div class="form-group-inline form-group-expansion">
          <label :for="`expansion-name-${index}`">Name:</label>
          <input :id="`expansion-name-${index}`" type="text" v-model="formData.expansions[index]" placeholder="Expansion name" />
        </div>
        <button type="button" @click="removeExpansionEntry(index)" class="btn btn-remove">Remove Expansion</button>
      </div>
      <button type="button" @click="addExpansionEntry" class="btn btn-add">Add Expansion</button>
    </fieldset>

    <button type="submit" class="btn btn-submit">Add Game</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import BggSearch from './BggSearch.vue'; // Import BggSearch component

const emit = defineEmits(['add-game']);

const getInitialFormData = () => ({
  name: '',
  storageLocation: '',
  cards: [{ type: '', count: null, sleeved: false }],
  manualLink: '',
  expansions: [],
  bggId: null, // Added bggId
  bggYearPublished: null // Added bggYearPublished
});

const formData = ref(getInitialFormData());

function handleBggGameSelected(selectedGame) {
  formData.value.bggId = selectedGame.bggId;
  formData.value.name = selectedGame.name; // Overwrite/pre-fill name
  formData.value.bggYearPublished = selectedGame.yearPublished;
  console.log('BGG Game Selected and Form Data Updated:', formData.value);
}

const addCardEntry = () => {
  formData.value.cards.push({ type: '', count: null, sleeved: false });
};

const removeCardEntry = (index) => {
  formData.value.cards.splice(index, 1);
  if (formData.value.cards.length === 0) {
    addCardEntry();
  }
};

const addExpansionEntry = () => {
  formData.value.expansions.push('');
};

const removeExpansionEntry = (index) => {
  formData.value.expansions.splice(index, 1);
};

const handleSubmit = () => {
  const newGame = {
    id: Date.now(),
    ...formData.value,
    // Ensure cards and expansions are deep copied if necessary
    cards: formData.value.cards.map(card => ({...card})),
    expansions: [...formData.value.expansions]
  };
  emit('add-game', newGame);
  formData.value = getInitialFormData(); // Reset form
};
</script>

<style scoped>
.board-game-form {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  margin: 20px auto;
  border: 1px solid #e0e0e0;
}

.board-game-form h3 {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label, .form-fieldset legend, .form-section legend { /* Added .form-section legend */
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95em;
}

.form-fieldset legend, .form-section legend { /* Added .form-section legend */
  font-size: 1.1em;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
  margin-bottom: 1rem;
  width: 100%;
}

.board-game-form input[type="text"],
.board-game-form input[type="url"],
.board-game-form input[type="number"] {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

.board-game-form input[type="text"]:focus,
.board-game-form input[type="url"]:focus,
.board-game-form input[type="number"]:focus {
  border-color: #42b983;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

.form-fieldset, .form-section { /* Added .form-section */
  border: none;
  padding: 0;
  margin-bottom: 1.5rem;
}

/* Styles for BGG Integration Section */
.form-section { /* This is the new fieldset class for BGG */
  border: 1px solid #ddd; /* Distinct border for this section */
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
  background-color: #fdfdfd; /* Slightly different background */
}
.form-section legend {
  font-weight: bold; /* Already covered, but can be more specific */
  padding: 0 0.5rem; /* Padding around legend text */
  color: #333;
  border-bottom: none; /* BGG section legend doesn't need a full border-bottom */
  margin-bottom: 0.75rem; /* Space after legend */
  width: auto; /* Fit content for legend */
}
.readonly-bgg-info {
  margin-top: 1rem; /* Space above BGG info */
  padding: 0.75rem;
  background-color: #e9ecef; /* Light grey background */
  border-radius: 4px;
  font-size: 0.9em;
  display: flex; /* Align label and span */
  gap: 0.5rem; /* Space between label and value */
  border: 1px solid #ced4da;
}
.readonly-bgg-info label {
  font-weight: bold;
  margin-bottom: 0; /* Override default label margin */
  color: #495057;
}
.readonly-bgg-info span {
  color: #212529;
}


.dynamic-entry {
  background-color: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #e7e7e7;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 0.75rem;
}

.form-group-inline {
  flex: 1;
}
.form-group-inline label {
  font-weight: normal;
  font-size: 0.9em;
}

.form-group-checkbox {
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem;
}

.form-group-checkbox input[type="checkbox"] {
  margin-right: 0.5rem;
  width: auto;
  accent-color: #42b983;
}
.form-group-checkbox label {
  font-weight: normal;
  margin-bottom: 0;
}

.form-group-expansion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.form-group-expansion label {
  flex-basis: 80px;
  flex-shrink: 0;
  text-align: right;
}

.btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s ease;
  text-transform: capitalize;
}

.btn-add {
  background-color: #5cb85c;
  color: white;
  display: block;
  margin-top: 0.5rem;
  width: fit-content;
}
.btn-add:hover {
  background-color: #4cae4c;
}

.btn-remove {
  background-color: #d9534f;
  color: white;
  font-size: 0.85em;
  padding: 0.4rem 0.8rem;
}
.btn-remove:hover {
  background-color: #c9302c;
}

.dynamic-entry .btn-remove {
  display: block;
  margin-left: auto;
  width: fit-content;
}

.btn-submit {
  background-color: #42b983;
  color: white;
  font-size: 1.1em;
  padding: 0.8rem 1.5rem;
  display: block;
  margin: 1.5rem auto 0;
  width: fit-content;
}
.btn-submit:hover {
  background-color: #36a272;
}
</style>
