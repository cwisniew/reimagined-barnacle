import { mount } from '@vue/test-utils';
import axios from 'axios';
import BggSearch from '@/components/BggSearch.vue';
import { nextTick } from 'vue';

// Mock axios
jest.mock('axios');

describe('BggSearch.vue', () => {
  let wrapper;

  beforeEach(() => {
    // Reset mocks and component before each test
    axios.get.mockReset();
    wrapper = mount(BggSearch);
    // Clear any previous search states if necessary by re-mounting or manually resetting refs
    wrapper.vm.searchQuery = '';
    wrapper.vm.previousSearchQuery = '';
    wrapper.vm.searchResults = [];
    wrapper.vm.isLoading = false;
    wrapper.vm.errorMessage = '';
    wrapper.vm.attemptedSearch = false;
  });

  it('calls BGG API via proxy path on performSearch', async () => {
    axios.get.mockResolvedValue({ data: '<items total="0"></items>', status: 200 }); // Mock a minimal successful response
    wrapper.vm.searchQuery = 'catan';
    await wrapper.vm.performSearch();
    expect(axios.get).toHaveBeenCalledWith('/api/bgg/search?type=boardgame&query=catan');
  });

  it('parses successful XML response and populates searchResults', async () => {
    const mockBggSearchXml = `
      <items total="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
        <item type="boardgame" id="13">
          <name type="primary" value="Catan"/>
          <yearpublished value="1995"/>
        </item>
        <item type="boardgame" id="169786">
          <name type="primary" value="Scythe"/>
          <yearpublished value="2016"/>
        </item>
      </items>
    `;
    axios.get.mockResolvedValue({ data: mockBggSearchXml, status: 200 });
    wrapper.vm.searchQuery = 'test';
    await wrapper.vm.performSearch();

    expect(wrapper.vm.searchResults.length).toBe(2);
    expect(wrapper.vm.searchResults).toEqual([
      { id: '13', name: 'Catan', yearPublished: '1995' },
      { id: '169786', name: 'Scythe', yearPublished: '2016' },
    ]);
    expect(wrapper.vm.errorMessage).toBe('');
  });

  it('handles BGG API 202 Accepted response', async () => {
    axios.get.mockResolvedValue({ status: 202 }); // No data needed, just the status
    wrapper.vm.searchQuery = 'longsearch';
    await wrapper.vm.performSearch();

    expect(wrapper.vm.errorMessage).toBe('BGG is processing the search. Please try again in a few moments.');
    expect(wrapper.vm.isLoading).toBe(false); // Should stop loading
  });

  it('handles API error (Network Error)', async () => {
    axios.get.mockRejectedValue({ message: 'Network Error' });
    wrapper.vm.searchQuery = 'errorsearch';
    await wrapper.vm.performSearch();

    expect(wrapper.vm.errorMessage).toContain('Network Error. Could not connect to the BGG API via the proxy.');
  });

  it('handles API error (BGG Server Error)', async () => {
    axios.get.mockRejectedValue({ response: { status: 500, statusText: 'Internal Server Error' } });
    wrapper.vm.searchQuery = 'servererror';
    await wrapper.vm.performSearch();

    expect(wrapper.vm.errorMessage).toContain('Error from BGG API: Internal Server Error (Status: 500)');
  });

  it('handles empty search query', async () => {
    wrapper.vm.searchQuery = '   '; // Empty or whitespace
    await wrapper.vm.performSearch();
    expect(axios.get).not.toHaveBeenCalled();
    expect(wrapper.vm.errorMessage).toBe('Please enter a game name to search.');
  });

  it('emits "bgg-game-selected" event with correct payload when a game is selected', async () => {
    // Populate searchResults first
    wrapper.vm.searchResults = [
      { id: '13', name: 'Catan', yearPublished: '1995' },
      { id: '169786', name: 'Scythe', yearPublished: '2016' },
    ];
    await nextTick(); // Wait for DOM update if results were rendered

    // Simulate clicking the first item (or call selectGame directly)
    // Using direct call for simplicity as DOM interaction for click might be finicky here
    wrapper.vm.selectGame(wrapper.vm.searchResults[0]);
    await nextTick();

    expect(wrapper.emitted('bgg-game-selected')).toBeTruthy();
    expect(wrapper.emitted('bgg-game-selected').length).toBe(1);
    expect(wrapper.emitted('bgg-game-selected')[0][0]).toEqual({
      bggId: '13',
      name: 'Catan',
      yearPublished: '1995',
    });
  });

  it('displays "No results found" message correctly', async () => {
    const mockEmptyXml = `<items total="0" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse"></items>`;
    axios.get.mockResolvedValue({ data: mockEmptyXml, status: 200 });
    const query = 'veryobscuregamequery';
    await wrapper.find('input[type="text"]').setValue(query);
    await wrapper.find('button').trigger('click'); // Simulate search button click

    expect(wrapper.vm.searchResults.length).toBe(0);
    expect(wrapper.vm.attemptedSearch).toBe(true);
    expect(wrapper.vm.isLoading).toBe(false);

    const noResultsDiv = wrapper.find('.no-results');
    expect(noResultsDiv.exists()).toBe(true);
    expect(noResultsDiv.text()).toContain(`No results found for "${query}".`);
  });
});
