import { mount } from '@vue/test-utils';
import BoardGameForm from '@/components/BoardGameForm.vue';

// Helper function to create a default set of props or options
const createWrapper = (options = {}) => {
  return mount(BoardGameForm, {
    ...options,
  });
};

describe('BoardGameForm.vue', () => {
  it('initializes formData correctly', () => {
    const wrapper = createWrapper();
    const initialFormData = wrapper.vm.formData;
    expect(initialFormData.name).toBe('');
    expect(initialFormData.storageLocation).toBe('');
    expect(initialFormData.manualLink).toBe('');
    expect(initialFormData.cards).toEqual([{ type: '', count: null, sleeved: false }]);
    expect(initialFormData.expansions).toEqual([]);
    expect(initialFormData.bggId).toBeNull();
    expect(initialFormData.bggYearPublished).toBeNull();
  });

  it('updates name in formData on input', async () => {
    const wrapper = createWrapper();
    const nameInput = wrapper.find('input[id="name"]');
    await nameInput.setValue('Gloomhaven');
    expect(wrapper.vm.formData.name).toBe('Gloomhaven');
  });

  it('adds a new card entry when "Add Card Type" is clicked', async () => {
    const wrapper = createWrapper();
    const initialCardCount = wrapper.vm.formData.cards.length;
    const addCardButton = wrapper.find('button.btn-add[aria-label="Add Card Type"]'); // More specific selector if needed

    // Fallback to less specific selector if the above doesn't work due to no aria-label
    const buttons = wrapper.findAll('button.btn-add');
    const addCardBtn = buttons.filter(b => b.text().includes('Add Card Type')).at(0);

    await addCardBtn.trigger('click');
    expect(wrapper.vm.formData.cards.length).toBe(initialCardCount + 1);
    expect(wrapper.vm.formData.cards[initialCardCount]).toEqual({ type: '', count: null, sleeved: false });
  });

  it('removes a card entry when "Remove Card" is clicked', async () => {
    const wrapper = createWrapper();
    // Add a card first to ensure there are two to remove one
    await wrapper.vm.addCardEntry(); // Now 2 cards
    let initialCardCount = wrapper.vm.formData.cards.length;
    expect(initialCardCount).toBe(2);

    const removeCardButton = wrapper.find('button.btn-remove[aria-label*="Remove Card"]'); // More specific
     // Fallback for remove card button
    const removeCardButtons = wrapper.findAll('button.btn-remove');
    const firstRemoveCardBtn = removeCardButtons.filter(b => b.text().includes('Remove Card')).at(0);

    await firstRemoveCardBtn.trigger('click');
    expect(wrapper.vm.formData.cards.length).toBe(initialCardCount - 1);
  });

  it('ensures at least one card entry remains after removal if form is designed that way', async () => {
    const wrapper = createWrapper(); // Starts with 1 card
    expect(wrapper.vm.formData.cards.length).toBe(1);

    const removeCardButtons = wrapper.findAll('button.btn-remove');
    const firstRemoveCardBtn = removeCardButtons.filter(b => b.text().includes('Remove Card')).at(0);

    await firstRemoveCardBtn.trigger('click');
    // Based on current BoardGameForm.vue logic, it adds a new card if the last one is removed.
    expect(wrapper.vm.formData.cards.length).toBe(1);
    expect(wrapper.vm.formData.cards[0]).toEqual({ type: '', count: null, sleeved: false });
  });


  it('adds a new expansion entry when "Add Expansion" is clicked', async () => {
    const wrapper = createWrapper();
    const initialExpansionCount = wrapper.vm.formData.expansions.length;

    const buttons = wrapper.findAll('button.btn-add');
    const addExpansionBtn = buttons.filter(b => b.text().includes('Add Expansion')).at(0);

    await addExpansionBtn.trigger('click');
    expect(wrapper.vm.formData.expansions.length).toBe(initialExpansionCount + 1);
    expect(wrapper.vm.formData.expansions[initialExpansionCount]).toBe('');
  });

  it('removes an expansion entry when "Remove Expansion" is clicked', async () => {
    const wrapper = createWrapper();
    await wrapper.vm.addExpansionEntry(); // Add an expansion to remove
    let initialExpansionCount = wrapper.vm.formData.expansions.length;
    expect(initialExpansionCount).toBe(1);

    const removeExpansionButtons = wrapper.findAll('button.btn-remove');
    const firstRemoveExpansionBtn = removeExpansionButtons.filter(b => b.text().includes('Remove Expansion')).at(0);

    await firstRemoveExpansionBtn.trigger('click');
    expect(wrapper.vm.formData.expansions.length).toBe(initialExpansionCount - 1);
  });

  it('emits "add-game" event with correct payload on form submission', async () => {
    const wrapper = createWrapper();
    const gameName = 'Terraforming Mars';
    const storage = 'Shelf A';
    const cardType = 'Standard';
    const cardCount = 100;

    await wrapper.find('input[id="name"]').setValue(gameName);
    await wrapper.find('input[id="storageLocation"]').setValue(storage);

    // Card details
    const cardTypeInput = wrapper.find('.dynamic-entry input[id^="card-type-"]');
    await cardTypeInput.setValue(cardType);
    const cardCountInput = wrapper.find('.dynamic-entry input[id^="card-count-"]');
    await cardCountInput.setValue(cardCount);
    // No need to set sleeved, defaults to false

    await wrapper.find('form.board-game-form').trigger('submit.prevent');

    expect(wrapper.emitted('add-game')).toBeTruthy();
    expect(wrapper.emitted('add-game').length).toBe(1);

    const emittedPayload = wrapper.emitted('add-game')[0][0];
    expect(emittedPayload.id).toBeDefined();
    expect(emittedPayload.name).toBe(gameName);
    expect(emittedPayload.storageLocation).toBe(storage);
    expect(emittedPayload.cards.length).toBe(1);
    expect(emittedPayload.cards[0].type).toBe(cardType);
    expect(emittedPayload.cards[0].count).toBe(cardCount);
    expect(emittedPayload.cards[0].sleeved).toBe(false);
    // Check for BGG fields (assuming they were set, e.g., by handleBggGameSelected or direct manipulation for test)
    expect(emittedPayload.bggId).toBe(wrapper.vm.formData.bggId); // or a specific value if set
    expect(emittedPayload.bggYearPublished).toBe(wrapper.vm.formData.bggYearPublished); // or a specific value
  });

  it('updates formData when handleBggGameSelected is called', () => {
    const wrapper = createWrapper();
    const selectedGame = {
      bggId: '266192',
      name: 'Wingspan',
      yearPublished: '2019'
    };
    wrapper.vm.handleBggGameSelected(selectedGame);
    expect(wrapper.vm.formData.name).toBe(selectedGame.name);
    expect(wrapper.vm.formData.bggId).toBe(selectedGame.bggId);
    expect(wrapper.vm.formData.bggYearPublished).toBe(selectedGame.yearPublished);
  });

  it('emits "add-game" event with BGG data if selected', async () => {
    const wrapper = createWrapper();
    const gameName = 'Wingspan';
    const bggGameData = { bggId: '266192', name: gameName, yearPublished: '2019' };

    // Simulate BGG game selection
    wrapper.vm.handleBggGameSelected(bggGameData);

    // Fill other required fields if necessary (name is now pre-filled)
    // For this test, we assume name is sufficient or other fields are not required for submission logic itself.

    await wrapper.find('form.board-game-form').trigger('submit.prevent');

    expect(wrapper.emitted('add-game')).toBeTruthy();
    const emittedPayload = wrapper.emitted('add-game')[0][0];
    expect(emittedPayload.name).toBe(gameName);
    expect(emittedPayload.bggId).toBe(bggGameData.bggId);
    expect(emittedPayload.bggYearPublished).toBe(bggGameData.yearPublished);
  });

  it('resets formData to initial state (including BGG fields) after submission', async () => {
    const wrapper = createWrapper();
    // Set some data, including BGG data
    await wrapper.find('input[id="name"]').setValue('A Game');
    wrapper.vm.handleBggGameSelected({ bggId: '123', name: 'BGG Game', yearPublished: '2020' });
    await wrapper.vm.addCardEntry();
    await wrapper.vm.addExpansionEntry();
    wrapper.vm.formData.expansions.push('An Expansion');


    await wrapper.find('form.board-game-form').trigger('submit.prevent');

    const initialFormData = {
      name: '',
      storageLocation: '',
      cards: [{ type: '', count: null, sleeved: false }],
      manualLink: '',
      expansions: [],
      bggId: null,
      bggYearPublished: null
    };
    expect(wrapper.vm.formData).toEqual(initialFormData);
  });
});
