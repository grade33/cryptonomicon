<script>
import { subscribeTicker, unSubscribeTicker } from './api';
import RemoveIcon from './components/icons/RemoveIcon.vue';
import LoadingIcon from './components/icons/LoadingIcon.vue';
import AddTicker from './components/AddTicker.vue';
import ShowGraph from './components/ShowGraph.vue';

export default {
  components: { AddTicker, ShowGraph, RemoveIcon, LoadingIcon },
  data() {
    return {
      pageLoading: true,
      filterValue: '',
      page: 1,
      tickerList: [],
      selectedTicker: null,
      tickerData: null,
      graph: [],
    };
  },
  created() {
    const storageTickerList =
      JSON.parse(localStorage.getItem('tickerList')) || [];
    this.tickerList = storageTickerList;
    this.tickerList.forEach((t) => {
      subscribeTicker(t.name, (newPrice) => {
        this.updateTickers(t.name, newPrice);
      });
    });
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );
    const VALID_KEYS = ['filter', 'page'];
    VALID_KEYS.forEach((key) => {
      if (windowData[key]) {
        this[key] = windowData[key];
      }
    });
  },
  mounted() {
    this.$nextTick().then(() => (this.pageLoading = false));
  },
  computed: {
    tickerNames() {
      return this.tickerList.map((t) => t.name);
    },
    filterValueUpperCase: {
      get() {
        return this.filterValue.toUpperCase();
      },
      set(newValue) {
        this.filterValue = newValue.toUpperCase();
      },
    },
    pageStateOptions() {
      return {
        page: this.page,
        filter: this.filterValue,
      };
    },
    startIndex() {
      return 6 * (this.page - 1);
    },
    endIndex() {
      return 6 * this.page;
    },
    filteredTickerList() {
      return this.tickerList.filter((t) => t.name.includes(this.filterValue));
    },
    paginationTickerList() {
      return this.filteredTickerList.slice(this.startIndex, this.endIndex);
    },
    isLastPage() {
      return this.endIndex >= this.filteredTickerList.length;
    },
  },
  watch: {
    tickerList() {
      localStorage.setItem('tickerList', JSON.stringify(this.tickerList));
    },
    pageStateOptions({ page, filter }) {
      const filterOption = filter ? `&filter=${filter}` : '';
      const pageOption = `?page=${page}`;
      window.history.pushState(
        null,
        'cryptonomicon',
        `${window.location.pathname}${pageOption}${filterOption}`
      );
    },
    filterValue() {
      this.page = 1;
    },
    paginationTickerList() {
      if (this.paginationTickerList.length === 0 && this.page > 1) {
        this.page--;
      }
    },
  },
  methods: {
    addTicker(tickerName) {
      const currentTicker = {
        name: tickerName,
        price: '-',
        isValid: false,
      };
      this.tickerList = [...this.tickerList, currentTicker];
      subscribeTicker(currentTicker.name, (newPrice) =>
        this.updateTickers(currentTicker.name, newPrice)
      );
    },
    updateTickers(tickerName, newPrice) {
      this.tickerList
        .filter((t) => t.name === tickerName)
        .forEach((t) => {
          t.price = newPrice;
          t.isValid = true;
          if (t === this.selectedTicker) {
            this.graph.push(t.price);
          }
        });
    },
    clearGraph() {
      this.graph = [];
    },
    formatPrice(price) {
      if (price === '-') return price;
      price = Number(price);
      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },
    removeTicker(tickerToRemove) {
      this.tickerList = this.tickerList.filter((t) => t !== tickerToRemove);
      unSubscribeTicker(tickerToRemove.name);
      if (this.selectedTicker === tickerToRemove)
        this.changeSelectedTicker(null);
    },
    changeSelectedTicker(tickerToSel) {
      this.selectedTicker = tickerToSel;
    },
  },
};
</script>

<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div
      v-if="pageLoading"
      class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center"
    >
      <LoadingIcon />
    </div>

    <div class="container">
      <!-- Add Ticker -->
      <AddTicker @add-ticker="addTicker" :ticker-names="tickerNames" />

      <!-- TickerList -->
      <template v-if="tickerList.length">
        <hr class="w-full border-t border-gray-600 my-4" />
        <div>
          <input
            v-model="filterValueUpperCase"
            autocomplete="off"
            type="text"
            class="block pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
          />
          <button
            @click="page--"
            :disabled="page <= 1"
            :class="{ 'opacity-70': page <= 1 }"
            type="button"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Назад
          </button>
          <span class="mx-2 text-xl font-medium">{{ page }}</span>
          <button
            @click="page++"
            :disabled="isLastPage"
            :class="{ 'opacity-70': isLastPage }"
            type="button"
            class="my-4 mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Вперед
          </button>
        </div>
        <template v-if="paginationTickerList.length">
          <hr class="w-full border-t border-gray-600 my-4" />
          <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div
              v-for="ticker in paginationTickerList"
              :key="ticker.name"
              @click="changeSelectedTicker(ticker)"
              :class="{
                'border-purple-800': selectedTicker === ticker,
                'bg-red-100': !ticker.isValid,
              }"
              class="bg-white overflow-hidden shadow rounded-lg border-transparent border-4 border-solid cursor-pointer"
            >
              <div class="px-4 py-5 sm:p-6 text-center">
                <dt class="text-sm font-medium text-gray-500 truncate">
                  {{ ticker.name }} - USD
                </dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900">
                  {{ formatPrice(ticker.price) }}
                </dd>
              </div>
              <div class="w-full border-t border-gray-200"></div>
              <button
                @click.stop="removeTicker(ticker)"
                class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
              >
                <RemoveIcon />
                Удалить
              </button>
            </div>
          </dl>
        </template>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>

      <!-- Graph -->
      <ShowGraph
        v-if="selectedTicker"
        :selected-ticker="selectedTicker"
        :graph="graph"
        @close-graph-bar="changeSelectedTicker(null)"
        @clear-graph="clearGraph"
      />
    </div>
  </div>
</template>
