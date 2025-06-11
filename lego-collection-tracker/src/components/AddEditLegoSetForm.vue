<template>
  <div class="form-container">
    <h3>{{ editingSet ? 'Edit Lego Set' : 'Add New Lego Set' }}</h3>
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <!-- Name -->
        <div class="form-group">
          <label for="name">Set Name *</label>
          <input type="text" id="name" v-model="formData.name" required />
        </div>

        <!-- Set Number -->
        <div class="form-group">
          <label for="setNumber">Set Number *</label>
          <input type="text" id="setNumber" v-model="formData.setNumber" required />
        </div>

        <!-- Description -->
        <div class="form-group full-width">
          <label for="description">Description</label>
          <textarea id="description" v-model="formData.description"></textarea>
        </div>

        <!-- Pictures (comma-separated URLs for simplicity) -->
        <div class="form-group full-width">
          <label for="pictures">Pictures (comma-separated URLs)</label>
          <input type="text" id="pictures" v-model="picturesString" placeholder="e.g., url1.jpg, url2.jpg" />
        </div>

        <!-- Number of Pieces -->
        <div class="form-group">
          <label for="numberOfPieces">Pieces *</label>
          <input type="number" id="numberOfPieces" v-model.number="formData.numberOfPieces" required min="0" />
        </div>

        <!-- Number of Minifigs -->
        <div class="form-group">
          <label for="numberOfMinifigs">Minifigures *</label>
          <input type="number" id="numberOfMinifigs" v-model.number="formData.numberOfMinifigs" required min="0" />
        </div>

        <!-- Quantity Owned -->
        <div class="form-group">
          <label for="quantityOwned">Quantity Owned *</label>
          <input type="number" id="quantityOwned" v-model.number="formData.quantityOwned" required min="1" />
        </div>

        <!-- Storage Location -->
        <div class="form-group">
          <label for="storageLocation">Storage Location</label>
          <input type="text" id="storageLocation" v-model="formData.storageLocation" />
        </div>

        <!-- Status -->
        <div class="form-group">
          <label for="status">Status *</label>
          <select id="status" v-model="formData.status" required>
            <option value="Owned">Owned</option>
            <option value="Wishlist">Wishlist</option>
            <option value="Ordered">Ordered</option>
          </select>
        </div>

        <!-- Is Built -->
        <div class="form-group form-group-checkbox">
          <input type="checkbox" id="isBuilt" v-model="formData.isBuilt" />
          <label for="isBuilt">Is it built?</label>
        </div>
      </div>

      <div v-if="localError" class="form-error-message">
        <p>Error: {{ localError }}</p>
      </div>
      <div v-if="isSubmitting" class="form-loading-message">
        <p>Submitting...</p>
      </div>
      <!-- Display global store loading message if not using local isSubmitting for this -->
      <div v-else-if="legoSetStore.loading && !isSubmitting" class="form-loading-message">
        <p>Loading...</p>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="isSubmitting || legoSetStore.loading">
          {{ editingSet ? 'Update Set' : 'Add Set' }}
        </button>
        <button type="button" @click="handleCancel" :disabled="isSubmitting || legoSetStore.loading">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, type PropType } from 'vue';
import { useLegoSetStore } from '../stores/legoStore'; // NEW
import type { LegoSet, CreateLegoSetData } from '../stores/legoStore'; // Types still useful

const legoSetStore = useLegoSetStore(); // NEW

const props = defineProps({
  editingSet: {
    type: Object as PropType<LegoSet | null>,
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'submit-success'): void;
  (e: 'cancel'): void;
}>();

const getInitialFormData = (): Omit<LegoSet, 'id'> => {
  if (props.editingSet) {
    // Ensure all fields defined in the form are present
    return {
        name: props.editingSet.name,
        setNumber: props.editingSet.setNumber,
        description: props.editingSet.description || '',
        pictures: props.editingSet.pictures || [],
        numberOfPieces: props.editingSet.numberOfPieces || 0,
        numberOfMinifigs: props.editingSet.numberOfMinifigs || 0,
        quantityOwned: props.editingSet.quantityOwned || 1,
        storageLocation: props.editingSet.storageLocation || '',
        isBuilt: props.editingSet.isBuilt || false,
        status: props.editingSet.status || 'Owned',
    };
  }
  return {
    name: '',
    setNumber: '',
    description: '',
    pictures: [],
    numberOfPieces: 0,
    numberOfMinifigs: 0,
    quantityOwned: 1,
    storageLocation: '',
    isBuilt: false,
    status: 'Owned',
  };
};

const formData = ref<Omit<LegoSet, 'id'>>(getInitialFormData());
const localError = ref<string | null>(null);
const isSubmitting = ref(false); // Local submitting state for form

const picturesString = computed({
  get: () => formData.value.pictures?.join(', ') || '',
  set: (value: string) => {
    formData.value.pictures = value.split(',').map(url => url.trim()).filter(url => url);
  }
});

watch(() => props.editingSet, (newSet) => {
  formData.value = getInitialFormData();
  localError.value = null; // Clear local error when form reinitializes
}, { immediate: true, deep: true });


const handleSubmit = async () => {
  localError.value = null;
  isSubmitting.value = true;
  legoSetStore.error = null; // NEW - Clear global store error (or use action)

  try {
    let success = false;
    if (props.editingSet && props.editingSet.id) {
      const result = await legoSetStore.updateSet(props.editingSet.id, formData.value); // NEW
      if (result) {
        success = true;
      }
    } else {
      // Ensure all required fields are correctly typed for CreateLegoSetData
      const createData: CreateLegoSetData = {
        name: formData.value.name,
        setNumber: formData.value.setNumber,
        description: formData.value.description,
        pictures: formData.value.pictures,
        numberOfPieces: formData.value.numberOfPieces,
        numberOfMinifigs: formData.value.numberOfMinifigs,
        quantityOwned: formData.value.quantityOwned,
        storageLocation: formData.value.storageLocation,
        isBuilt: formData.value.isBuilt,
        status: formData.value.status,
      };
      const result = await legoSetStore.addSet(createData); // NEW
      if (result) {
        success = true;
      }
    }

    if (success) {
      emit('submit-success');
    } else {
      // If success is false but no specific error was thrown by store (e.g. store returns null)
      // Use global error from store if available, or set a generic local one.
      localError.value = legoSetStore.error || 'Submission failed. Please try again.'; // NEW
    }
  } catch (error: any) { // Catch any unexpected errors from store methods
    console.error("Form submission error:", error);
    localError.value = error.message || legoSetStore.error || 'An unexpected error occurred.'; // NEW
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  localError.value = null;
  emit('cancel');
};

</script>

<style scoped>
/* Using CSS variables defined in App.vue's global style, with fallbacks */
.form-container {
  background-color: #fff; /* Cleaner background */
  padding: 1.5rem 2rem; /* More padding */
  border-radius: var(--border-radius, 0.3rem);
  box-shadow: var(--box-shadow, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075));
  /* max-width can be controlled by .modal-content in App.vue, or set here if used outside modal */
}

.form-container h3 {
  text-align: center;
  margin-bottom: 1.5rem; /* More space below title */
  color: var(--text-color, #212529);
  font-weight: 500;
  font-size: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive columns */
  gap: 1rem 1.5rem; /* Consistent gap */
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem; /* Space below each group */
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 0.3rem; /* Space between label and input */
  font-weight: 500; /* Slightly less bold */
  color: var(--text-muted-color, #6c757d);
  font-size: 0.9rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  padding: 0.6rem 0.75rem; /* Standardized padding */
  border: 1px solid var(--border-color, #ced4da);
  border-radius: var(--border-radius, 0.3rem);
  font-size: 0.95rem; /* Slightly adjusted font size */
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--primary-color, #007bff);
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-group textarea {
  min-height: 100px; /* Increased min-height */
  resize: vertical;
}

.form-group-checkbox {
  display: flex; /* Use flex for better alignment */
  flex-direction: row;
  align-items: center;
  grid-column: 1 / -1;
  padding-top: 0.5rem; /* Align with other form groups */
}

.form-group-checkbox input[type="checkbox"] {
  margin-right: 0.5rem; /* Space between checkbox and label */
  height: 1.1em; /* Slightly larger checkbox */
  width: 1.1em;
  accent-color: var(--primary-color, #007bff); /* Color the checkbox */
}

.form-group-checkbox label {
  margin-bottom: 0;
  font-weight: normal; /* Normal weight for checkbox label */
  color: var(--text-color, #212529);
}

/* Message styling (error and loading) */
.form-message { /* Base class for form messages */
  padding: 0.75rem 1.25rem;
  margin-top: 1rem; /* Space above message */
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius, 0.3rem);
  text-align: center;
}

.form-error-message {
  background-color: #f8d7da;
  color: var(--danger-color, #721c24);
  border-color: #f5c6cb;
}

.form-loading-message {
  background-color: #e2e3e5;
  color: var(--text-muted-color, #383d41);
  border-color: #d6d8db;
}

.form-actions {
  margin-top: 1.5rem; /* More space above actions */
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem; /* Consistent gap */
  padding-top: 1rem; /* Space if there's a border or line above */
  border-top: 1px solid var(--border-color, #eee); /* Separator line */
}

.form-actions button {
  padding: 0.6rem 1.25rem; /* Standardized padding */
  border: none;
  border-radius: var(--border-radius, 0.3rem);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.form-actions button[type="submit"] {
  background-color: var(--success-color, #28a745);
  color: white;
}
.form-actions button[type="submit"]:hover:not(:disabled) {
  background-color: #218838; /* Darken success */
}

.form-actions button[type="button"] {
  background-color: var(--secondary-color, #6c757d);
  color: white;
}
.form-actions button[type="button"]:hover:not(:disabled) {
  background-color: #5a6268; /* Darken secondary */
}

.form-actions button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
