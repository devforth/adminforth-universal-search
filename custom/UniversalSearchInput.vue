<template>
  <div class="af-universal-search flex items-center gap-1">
    <slot name="prefix" />
    <input
      v-model="localValue"
      type="text"
      :placeholder="props.meta?.placeholder ?? ''"
      class="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600"
      :class="localValue ? 'w-[222px]' : 'w-64'"
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
import { ref, watch, onMounted } from 'vue';
import adminforth from '@/adminforth';
import { AdminForthFilterOperators } from '@/types/Common';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps<{ meta?: any; resource?: any; adminUser?: any }>();
const localValue = ref('');
let t: any = null;
let blockFilterUpdate = false;

onMounted(() => {
  const filters = Object.keys(route.query).filter(k => k.startsWith('filter__')).map(k => {
    const [_, field, operator] = k.split('__');
    return {
      field,
      operator,
      value: JSON.parse(decodeURIComponent(route.query[k] as string))
    }
  });
  const isUniversalSearchFilterApplied = filters.find(f => f.field === '_universal_search');
  if (isUniversalSearchFilterApplied) {
    localValue.value = isUniversalSearchFilterApplied.value;
    blockFilterUpdate = true;
  };
});

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
  if (blockFilterUpdate) {
    blockFilterUpdate = false;
    return;
  }
  const delay = props.meta?.debounceMs ?? 500;
  if (t) clearTimeout(t);
  t = setTimeout(apply, delay);
});

function clear() {
  blockFilterUpdate = true;
  localValue.value = '';
  applyImmediate();
}
</script>