<script setup lang="ts">
import { computed } from 'vue';
import { withBase } from 'vitepress';
import { data as taken } from './shots.data';

/**
 * A screenshot by its id: `docs/public/shots/<id>-light.png` in the light
 * theme and `<id>-dark.png` in the dark one. Until both are taken, a dashed
 * box shows the id and what the screenshot is to show.
 */
const props = defineProps<{ id: string; alt: string }>();

const light = computed(() => `${props.id}-light.png`);
const dark = computed(() => `${props.id}-dark.png`);
const ready = computed(() => taken.includes(light.value) && taken.includes(dark.value));
</script>

<template>
  <figure v-if="ready" class="ahpw-shot">
    <img class="light-only" :src="withBase(`/shots/${light}`)" :alt="alt" />
    <img class="dark-only" :src="withBase(`/shots/${dark}`)" :alt="alt" />
  </figure>
  <div v-else class="ahpw-shot ahpw-shot--todo">
    <code>shots/{{ id }}</code>
    {{ alt }}
  </div>
</template>
