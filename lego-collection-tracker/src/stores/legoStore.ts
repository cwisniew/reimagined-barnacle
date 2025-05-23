import { reactive, watch, readonly } from 'vue';

// --- Type Definition for a Lego Set ---
export interface LegoSet {
  id: number; // Unique identifier
  name: string; // e.g., "Millennium Falcon"
  setNumber: string; // e.g., "75192"
  description?: string; // Optional
  pictures?: string[]; // Array of image URLs, optional
  numberOfPieces: number;
  numberOfMinifigs: number;
  quantityOwned: number;
  storageLocation?: string; // Optional
  isBuilt: boolean;
  status: 'Owned' | 'Wishlist' | 'Ordered'; // Enum-like type
}

// --- Reactive State ---
interface LegoStoreState {
  legoSets: LegoSet[];
  nextId: number;
}

// Attempt to load sets from localStorage
const initialSets: LegoSet[] = JSON.parse(localStorage.getItem('legoCollection') || '[]') as LegoSet[];

// Ensure proper ID initialization if localStorage is corrupted or IDs are not numbers
const maxIdFromStorage = initialSets.reduce((maxId, set) => Math.max(set.id && typeof set.id === 'number' ? set.id : 0, maxId), 0);

const state = reactive<LegoStoreState>({
  legoSets: initialSets,
  nextId: maxIdFromStorage + 1
});

// Watch for changes in legoSets and save to localStorage
watch(() => state.legoSets, (newSets) => {
  localStorage.setItem('legoCollection', JSON.stringify(newSets));
}, { deep: true });

// --- Store Methods ---

function getNextId(): number {
  return state.nextId++;
}

function getAllSets(): Readonly<LegoSet[]> {
  return readonly(state.legoSets);
}

// Use Partial<LegoSet> for creation to make most fields optional initially
// but require name, setNumber, numberOfPieces, numberOfMinifigs, quantityOwned, isBuilt, status.
type CreateLegoSetData = Pick<LegoSet, 'name' | 'setNumber'> & Partial<Omit<LegoSet, 'id' | 'name' | 'setNumber'>>;

function addSet(newSetData: CreateLegoSetData): LegoSet {
  const newSet: LegoSet = {
    id: getNextId(),
    name: newSetData.name,
    setNumber: newSetData.setNumber,
    description: newSetData.description || '',
    pictures: newSetData.pictures || [],
    numberOfPieces: newSetData.numberOfPieces || 0,
    numberOfMinifigs: newSetData.numberOfMinifigs || 0,
    quantityOwned: newSetData.quantityOwned || 1,
    storageLocation: newSetData.storageLocation || '',
    isBuilt: newSetData.isBuilt || false,
    status: newSetData.status || 'Owned' // Default status
  };
  state.legoSets.push(newSet);
  return readonly(newSet); // Return a readonly version
}

function getSetById(id: number): Readonly<LegoSet> | undefined {
  const set = state.legoSets.find(s => s.id === id);
  return set ? readonly(set) : undefined;
}

// For updates, all fields in LegoSet are optional, except 'id' which is used for lookup
type UpdateLegoSetData = Partial<Omit<LegoSet, 'id'>>;

function updateSet(id: number, updatedData: UpdateLegoSetData): Readonly<LegoSet> | null {
  const setIndex = state.legoSets.findIndex(set => set.id === id);
  if (setIndex !== -1) {
    // Create a new object for the updated set to maintain reactivity properly for watchers on the object itself
    state.legoSets[setIndex] = { ...state.legoSets[setIndex], ...updatedData };
    return readonly(state.legoSets[setIndex]);
  }
  console.warn(`Set with id ${id} not found for update.`);
  return null;
}

function deleteSet(id: number): boolean {
  const setIndex = state.legoSets.findIndex(set => set.id === id);
  if (setIndex !== -1) {
    state.legoSets.splice(setIndex, 1);
    return true;
  }
  return false;
}

// Export the reactive state (as readonly) and methods
export default {
  state: readonly(state), // Expose state as readonly to encourage mutations only through methods
  getAllSets,
  addSet,
  getSetById,
  updateSet,
  deleteSet
};
