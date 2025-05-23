<template>
  <div class="lego-set-list-container">
    <h2>My Lego Collection</h2>
    <div v-if="legoStore.state.legoSets && legoStore.state.legoSets.length > 0" class="lego-set-list">
      <LegoSetCard
        v-for="set in legoStore.state.legoSets"
        :key="set.id"
        :set="set"
        @edit-set="handleEditSet"
        @delete-set="handleDeleteSet"
      />
    </div>
    <div v-else class="empty-list-message">
      <p>Your Lego collection is currently empty. Start by adding a new set!</p>
    </div>
    <!-- We'll add a button/modal for adding sets later, likely in App.vue or a dedicated controls component -->
  </div>
</template>

<script setup lang="ts">
import LegoSetCard from './LegoSetCard.vue';
import legoStore from '../stores/legoStore'; // Default export
import type { LegoSet } from '../stores/legoStore'; // Named export for the type

// No need to explicitly fetch all sets if legoStore.state.legoSets is directly used in template,
// as it's already reactive. If we had a getter function like `getAllSets()` that returned a computed
// or filtered list, we might call it here. For now, direct state access is fine.

const handleEditSet = (setId: number) => {
  console.log('Attempting to edit set with ID:', setId);
  // Placeholder for edit functionality
  // Typically, this would open a modal or navigate to an edit page,
  // pre-filling a form with the set's data.
  // For now, we can just log it.
  const setToEdit = legoStore.getSetById(setId);
  if (setToEdit) {
    alert(`Editing: ${setToEdit.name} (ID: ${setToEdit.id}) - Implementation pending.`);
  }
};

const handleDeleteSet = (setId: number) => {
  console.log('Attempting to delete set with ID:', setId);
  const setToDelete = legoStore.getSetById(setId); // Get details for confirm message
  if (setToDelete) {
    // Confirmation is already in LegoSetCard, but good for a top-level check too if needed.
    // legoStore.deleteSet(setId) was called by the card if confirm passed.
    // Here, we might just log or update UI further if necessary.
    // For now, the card handles the direct deletion via emit.
    // If the card *only* emitted and didn't call deleteSet, we'd do it here:
    // if (confirm(`Are you sure you want to delete "${setToDelete.name}" from the list view?`)) {
    //   legoStore.deleteSet(setId);
    // }
    alert(`Set "${setToDelete.name}" (ID: ${setId}) delete action triggered. legoStore.deleteSet was called by LegoSetCard.`);
  } else {
    alert(`Set with ID: ${setId} not found for deletion.`);
  }
};
</script>

<style scoped>
.lego-set-list-container {
  padding: 20px;
}

.lego-set-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* Responsive grid */
  gap: 20px;
}

.empty-list-message {
  text-align: center;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
}

.empty-list-message p {
  font-size: 1.2em;
  color: #555;
}
</style>
