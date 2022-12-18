<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700">
          Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="tickerValueUpperCase"
            @keydown.enter="addTicker"
            autocomplete="off"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-if="tickerHints.length"
          class="flex bg-white shadow-md p-1 rounded-md flex-wrap"
        >
          <span
            v-for="(tName, idx) in tickerHints"
            :key="idx"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            <button @click="addTickerFromHint(tName)">{{ tName }}</button>
          </span>
        </div>
        <div v-if="showErr" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <button
      @click="addTicker"
      :disabled="showErr"
      :class="{ 'opacity-50': showErr }"
      class="my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      type="button"
    >
      <PlusIcon />
      Добавить
    </button>
  </section>
</template>

<script>
import PlusIcon from './icons/PlusIcon.vue';

export default {
  components: { PlusIcon },
  emits: {
    addTicker: (tickerValue) => tickerValue.length,
  },
  props: {
    tickerNames: {
      type: Array,
      requried: false,
      default: () => [],
    },
  },
  data() {
    return {
      tickerValue: '',
      tickerData: null,
    };
  },
  async created() {
    const resp = await fetch(
      'https://min-api.cryptocompare.com/data/all/coinlist?summary=true'
    );
    const rawTickerData = (await resp.json()).Data;
    this.tickerData = Object.keys(rawTickerData);
  },
  computed: {
    tickerValueUpperCase: {
      get() {
        return this.tickerValue.toUpperCase();
      },
      set(newValue) {
        this.tickerValue = newValue.toUpperCase();
      },
    },
    tickerHints() {
      if (!this.tickerValue) return [];

      let i = 1;
      return this.tickerData.filter((tName) => {
        if (i < 5 && tName.includes(this.tickerValue)) {
          i++;
          return true;
        }
      });
    },
    showErr() {
      return this.tickerNames.some((tName) => tName === this.tickerValue);
    },
  },
  methods: {
    addTickerFromHint(tName) {
      this.tickerValue = tName;
      this.addTicker();
    },
    addTicker() {
      if (!this.tickerValue.length || this.showErr) return;

      this.$emit('addTicker', this.tickerValue);
      this.tickerValue = '';
    },
  },
};
</script>
