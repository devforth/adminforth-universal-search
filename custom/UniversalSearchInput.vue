<template>
  <div class="af-universal-search flex items-center gap-1">
    <slot name="prefix" />
    <input
      v-model="localValue"
      type="text"
      placeholder="Universal search..."
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
const adminforth: any = (window as any).adminforth || {};

const props = defineProps<{ meta?: any; resource?: any; adminUser?: any }>();
const localValue = ref('');
let debounceTimer: any = null;
const filtersStore = adminforth.filtersStore || { filters: [], setFilters: () => {} };

function buildFilters(term: string) {
  const cols = props.meta?.columns as Array<any> | undefined;
  if (!cols || !cols.length) return [];
  const result: any[] = [];

  cols.forEach(col => {
    const searchBy = (col.searchBy === 'labelOnly' ? 'keyOnly' : col.searchBy) || 'valueOnly';
    const addFilter = (field: string) => {
      let operator: string;
      let value: string;
      if (col.exact) {
        if (col.caseSensitive) {
          operator = 'like';
          value = term;
        } else {
          operator = 'eq';
          value = term;
        }
      } else {
        operator = col.caseSensitive ? 'like' : 'ilike';
        value = `${term}`;
      }
      result.push({ field, operator, value });
    };

    if (searchBy === 'valueOnly') {
      addFilter(col.name);
    } else if (searchBy === 'keyOnly') {
      addFilter(`${col.name}__key`);
    } else if (searchBy === 'both') {
      addFilter(col.name);
      addFilter(`${col.name}__key`);
    }
  });

  return result;
}

function applyInternal() {
  const term = localValue.value.trim();
  const remaining = filtersStore.filters.filter((f: any) => !f._universal);
  if (!term) {
    filtersStore.setFilters(remaining);
    adminforth.list.refresh && adminforth.list.refresh();
    return;
  }
  const sub = buildFilters(term);
  if (!sub || !sub.length) {
    filtersStore.setFilters(remaining);
    adminforth.list.refresh && adminforth.list.refresh();
    return;
  }
  const orGroup = { operator: 'or', subFilters: sub, _universal: true };
  filtersStore.setFilters([...remaining, orGroup]);
  adminforth.list.refresh && adminforth.list.refresh();
}

function applyImmediate() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  applyInternal();
}

watch(localValue, () => {
  const delay = props.meta?.debounceMs ?? 500;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    applyInternal();
  }, delay);
});

function clear() {
  localValue.value = '';
  applyImmediate();
}
</script>
