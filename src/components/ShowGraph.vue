<template>
  <section class="relative">
    <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
      {{ selectedTicker.name }} - USD
    </h3>
    <div
      ref="graph"
      class="flex items-end border-gray-600 border-b border-l h-64"
    >
      <div
        v-for="(bar, idx) in normalizedGraph"
        :key="idx"
        :style="{ height: bar + '%', width: graphBarWidth + 'px' }"
        class="bg-purple-800 border"
      ></div>
    </div>
    <button
      @click="$emit('closeGraphBar')"
      type="button"
      class="absolute top-0 right-0"
    >
      <CloseIcon />
    </button>
  </section>
</template>

<script>
import CloseIcon from './icons/CloseIcon.vue';

export default {
  components: { CloseIcon },
  props: {
    selectedTicker: {
      type: Object,
      required: true,
    },
    graph: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      maxGraphElements: 1,
      graphBarWidth: 38,
    };
  },
  computed: {
    correctGraphAmount() {
      const correctGraphAmount = [];
      const reverseGraph = [...this.graph].reverse();
      for (
        let i = 0;
        i < reverseGraph.length && i < this.maxGraphElements;
        i++
      ) {
        correctGraphAmount.push(reverseGraph[i]);
      }
      return correctGraphAmount;
    },
    normalizedGraph() {
      const minValue = Math.min(...this.graph);
      const maxValue = Math.max(...this.graph);
      return this.correctGraphAmount.map((price) => {
        return minValue === maxValue
          ? 50
          : 5 + ((price - minValue) * 95) / (maxValue - minValue);
      });
    },
  },
  watch: {
    selectedTicker(newValue, oldValue) {
      if (newValue === oldValue) return;
      this.$emit('clearGraph');
    },
  },
  methods: {
    calculateMaxGraphElements() {
      if (!this.$refs.graph) return;
      this.maxGraphElements = this.$refs.graph.clientWidth / this.graphBarWidth;
    },
  },
  mounted() {
    this.calculateMaxGraphElements();
    window.addEventListener('resize', this.calculateMaxGraphElements);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.calculateMaxGraphElements);
  },
};
</script>

<style lang="scss" scoped></style>
