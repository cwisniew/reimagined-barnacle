<template>
  <form @submit.prevent="handleSubmit" class="board-game-form">
    <h3>Add New Board Game</h3>

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

const emit = defineEmits(['add-game']);

const getInitialFormData = () => ({
  name: '',
  storageLocation: '',
  cards: [{ type: '', count: null, sleeved: false }],
  manualLink: '',
  expansions: []
});

const formData = ref(getInitialFormData());

const addCardEntry = () => {
  formData.value.cards.push({ type: '', count: null, sleeved: false });
};

const removeCardEntry = (index) => {
  formData.value.cards.splice(index, 1);
  if (formData.value.cards.length === 0) { // Optionally ensure there's always one card entry
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
    cards: formData.value.cards.map(card => ({...card})),
    expansions: [...formData.value.expansions]
  };
  emit('add-game', newGame);
  formData.value = getInitialFormData();
};
</script>

<style scoped>
.board-game-form {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  /* box-shadow: 0 2px 10px rgba(0,0,0,0.05); */ /* Shadow inherited from #app now */
  margin: 20px auto; /* Centered, with space */
  border: 1px solid #e0e0e0; /* Softer border */
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

.form-group label, .form-fieldset legend {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500; /* Slightly bolder labels */
  font-size: 0.95em;
}

.form-fieldset legend {
  font-size: 1.1em; /* Larger legend for fieldsets */
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
  margin-bottom: 1rem; /* Space below legend */
  width: 100%; /* Make legend span full width */
}

.board-game-form input[type="text"],
.board-game-form input[type="url"],
.board-game-form input[type="number"] {
  width: 100%;
  padding: 0.6rem 0.8rem; /* Adjusted padding */
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

.board-game-form input[type="text"]:focus,
.board-game-form input[type="url"]:focus,
.board-game-form input[type="number"]:focus {
  border-color: #42b983; /* Vue green focus */
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}


.form-fieldset {
  border: none; /* Remove default fieldset border */
  padding: 0;
  margin-bottom: 1.5rem; /* Space between fieldsets */
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
  gap: 1rem; /* Spacing between inline form groups */
  align-items: flex-end; /* Align items to bottom for varied input heights */
  margin-bottom: 0.75rem; /* Space before remove button */
}

.form-group-inline {
  flex: 1; /* Allow inline groups to grow */
}
.form-group-inline label {
  font-weight: normal;
  font-size: 0.9em;
}

.form-group-checkbox {
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem; /* Align with input baseline */
}

.form-group-checkbox input[type="checkbox"] {
  margin-right: 0.5rem;
  width: auto; /* Override default width for checkbox */
  accent-color: #42b983; /* Vue green for checkbox */
}
.form-group-checkbox label {
  font-weight: normal;
  margin-bottom: 0; /* No bottom margin for checkbox label */
}

.form-group-expansion { /* Specific styling for expansion input row */
  display: flex;
  align-items: center; /* Vertically center label and input */
  gap: 0.5rem;
}
.form-group-expansion label {
  flex-basis: 80px; /* Fixed width for "Name:" label */
  flex-shrink: 0;
  text-align: right;
}


/* Buttons */
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
  background-color: #5cb85c; /* Green for add */
  color: white;
  display: block; /* Make add buttons block level */
  margin-top: 0.5rem; /* Space above add button */
  width: fit-content; /* Fit content width */
}
.btn-add:hover {
  background-color: #4cae4c;
}

.btn-remove {
  background-color: #d9534f; /* Red for remove */
  color: white;
  font-size: 0.85em; /* Smaller remove button */
  padding: 0.4rem 0.8rem;
}
.btn-remove:hover {
  background-color: #c9302c;
}

.dynamic-entry .btn-remove {
  display: block; /* Make remove button block */
  margin-left: auto; /* Push to the right */
  width: fit-content;
}


.btn-submit {
  background-color: #42b983; /* Vue green for primary action */
  color: white;
  font-size: 1.1em;
  padding: 0.8rem 1.5rem;
  display: block;
  margin: 1.5rem auto 0; /* Centered with space above */
  width: fit-content;
}
.btn-submit:hover {
  background-color: #36a272;
}

</style>
