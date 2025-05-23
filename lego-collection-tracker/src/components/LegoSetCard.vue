<template>
  <div class="lego-set-card">
    <h3>{{ set.name }} ({{ set.setNumber }})</h3>
    <div v-if="set.pictures && set.pictures.length > 0" class="pictures">
      <img v-for="(picUrl, index) in set.pictures" :key="index" :src="picUrl" :alt="`${set.name} picture ${index + 1}`" class="lego-set-image">
    </div>
    <p v-else class="no-picture">No pictures available</p>
    
    <p><strong>Description:</strong> {{ set.description || 'N/A' }}</p>
    <p><strong>Pieces:</strong> {{ set.numberOfPieces }}</p>
    <p><strong>Minifigures:</strong> {{ set.numberOfMinifigs }}</p>
    <p><strong>Quantity Owned:</strong> {{ set.quantityOwned }}</p>
    <p><strong>Stored In:</strong> {{ set.storageLocation || 'N/A' }}</p>
    <p><strong>Status:</strong> <span :class="`status-${set.status.toLowerCase()}`">{{ set.status }}</span></p>
    <p><strong>Built:</strong> {{ set.isBuilt ? 'Yes' : 'No' }}</p>
    
    <!-- Basic actions - will be implemented later -->
    <div class="actions">
      <button @click="editSet">Edit</button>
      <button @click="deleteSet">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, type PropType } from 'vue';
import type { LegoSet } from '../stores/legoStore'; // Adjust path if necessary

// Define the props this component accepts
const props = defineProps({
  set: {
    type: Object as PropType<LegoSet>,
    required: true
    // No default needed here if required is true and always provided.
    // If a default is desired for some reason, it must match the LegoSet structure.
  }
});

// Define emits for actions
// Type safety for emitted events can be added like this:
const emit = defineEmits<{
  (e: 'edit-set', id: number): void;
  (e: 'delete-set', id: number): void;
}>();

function editSet() {
  // props.set should be guaranteed by `required: true`
  emit('edit-set', props.set!.id);
}

function deleteSet() {
  // props.set should be guaranteed
  if (confirm(`Are you sure you want to delete "${props.set!.name}"? This action cannot be undone.`)) {
    emit('delete-set', props.set!.id);
  }
}
</script>

<style scoped>
.lego-set-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
  background-color: #fff;
}

.lego-set-card h3 {
  margin-top: 0;
  color: #333;
}

.pictures {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  overflow-x: auto; /* Allow scrolling if many pictures */
}

.lego-set-image {
  max-width: 150px;
  max-height: 150px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.no-picture {
  font-style: italic;
  color: #777;
  margin-bottom: 10px;
}

.lego-set-card p {
  margin: 8px 0;
  color: #555;
}

.lego-set-card strong {
  color: #444;
}

.status-owned {
  font-weight: bold;
  color: green;
}
.status-wishlist {
  font-weight: bold;
  color: orange;
}
.status-ordered {
  font-weight: bold;
  color: blue;
}

.actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.actions button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
}

.actions button:hover {
  background-color: #0056b3;
}

.actions button:last-child {
  background-color: #dc3545; /* Red for delete */
}
.actions button:last-child:hover {
  background-color: #c82333;
}
</style>
