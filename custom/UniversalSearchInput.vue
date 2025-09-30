<template>
  <div class="af-universal-search flex items-center gap-1">
    <slot name="prefix" />
      <div class="relative w-64">
        <input
          v-model="localValue"
          type="text"
          :placeholder="props.meta?.placeholder ?? ''"
          class="w-full border rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white px-2 py-1 pr-6"
          @keyup.enter="applyImmediate"
        >
        <p
          v-if="localValue"
          @click="clear"
          class="absolute right-2 top-1/2 -translate-y-1/2 hover:cursor-pointer hover:text-gray-600 dark:text-white dark:hover:text-gray-400  "
        >
          ✕
        </p>
      </div>
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