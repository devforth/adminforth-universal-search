<template>
  <div class="af-universal-search flex items-center gap-1">
    <slot name="prefix" />
    <input
      v-model="localValue"
      type="text"
      :placeholder="props.meta?.placeholder ?? ''"
      class="border rounded px-2 py-1 text-sm w-64 dark:bg-gray-800 dark:border-gray-600"
      @keyup.enter="applyImmediate"
    />
    <button
      v-if="localValue"
      @click="clear"
      class="flex items-center py-1 px-2 text-sm font-medium text-lightListViewButtonText focus:outline-none bg-lightListViewButtonBackground rounded border border-lightListViewButtonBorder hover:bg-lightListViewButtonBackgroundHover hover:text-lightListViewButtonTextHover focus:z-10 focus:ring-4 focus:ring-lightListViewButtonFocusRing dark:focus:ring-darkListViewButtonFocusRing dark:bg-darkListViewButtonBackground dark:text-darkListViewButtonText dark:border-darkListViewButtonBorder dark:hover:text-darkListViewButtonTextHover dark:hover:bg-darkListViewButtonBackgroundHover rounded-default"
      type="button"
    >
      ✕
    </button>
    <slot name="suffix" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import adminforth from '@/adminforth';
import { AdminForthFilterOperators } from '@/types/Common';

const props = defineProps<{ meta?: any; resource?: any; adminUser?: any }>();
const localValue = ref('');
let t: any = null;

function send(term?: string) {
  adminforth?.list?.updateFilter?.({
    field: '_universal_search',
    operator: AdminForthFilterOperators.EQ,
    value: term || '',
  });
  adminforth?.list?.refresh?.();
}

function apply() {
  const term = localValue.value.trim();
  send(term || '');
}

function applyImmediate() {
  if (t) clearTimeout(t);
  t = null;
  apply();
}

watch(localValue, () => {
  const delay = props.meta?.debounceMs ?? 500;
  if (t) clearTimeout(t);
  t = setTimeout(apply, delay);
});

function clear() {
  localValue.value = '';
  applyImmediate();
}
</script>