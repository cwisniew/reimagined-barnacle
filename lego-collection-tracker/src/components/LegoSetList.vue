<template>
  <div class="lego-set-list-container">
    <!-- Title was here, App.vue has a global title, list could have its own sub-title if needed -->
    <!-- <h2>My Lego Collection</h2> -->

    <div v-if="props.isLoading && props.sets.length === 0" class="loading-message">
      <p>Loading sets...</p>
    </div>
    <div v-else-if="props.errorMessage" class="error-message">
      <p>Error loading sets: {{ props.errorMessage }}</p>
      <p>Please try refreshing or check back later.</p>
    </div>
    <div v-else-if="props.sets && props.sets.length > 0" class="lego-set-list">
      <LegoSetCard
        v-for="set in props.sets"
        :key="set.id"
        :set="set"
        @edit-set="handleEditSet"
        @delete-set="handleDeleteSet" 
      />
    </div>
    <div v-else class="empty-list-message">
      <p>No Lego sets match your current filters, or your collection is empty. Try adding some!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, type PropType } from 'vue'; // Keep defineEmits
import LegoSetCard from './LegoSetCard.vue';
import type { LegoSet } from '../stores/legoStore';
// legoStore import might still be used by handlers if they need to get fresh data after an action,
// but for display, it relies on props.
import legoStore from '../stores/legoStore';


const props = defineProps({
  sets: {
    type: Array as PropType<LegoSet[]>,
    required: true,
    default: () => []
  },
  isLoading: { // New prop
    type: Boolean,
    default: false
  },
  errorMessage: { // New prop
    type: String,
    default: ''
  }
});

const emit = defineEmits<{ // Keep existing emits
  (e: 'edit-set', id: number): void;
  (e: 'delete-set', id: number): void;
}>();

// Handlers remain largely the same, re-emitting events.
const handleEditSet = (setId: number) => {
  console.log('LegoSetList: Edit event received, re-emitting for App.vue. ID:', setId);
  emit('edit-set', setId);
};

const handleDeleteSet = (setId: number) => {
  // LegoSetCard handles the actual deletion. This is more of a notification/re-emit.
  console.log('LegoSetList: Delete event received, re-emitting for App.vue. ID:', setId);
  emit('delete-set', setId);
};
</script>

<style scoped>
.loading-message, .error-message {
  text-align: center;
  padding: 40px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 1.2em;
  color: #555;
}
.error-message {
  background-color: #ffebee; /* Light pink for errors */
  color: #c62828; /* Darker red for error text */
}

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
