export type SearchByMode = 'valueOnly' | 'labelOnly' | 'keyOnly' | 'both';

export interface UniversalSearchColumnConfig {
  name: string;
  caseSensitive?: boolean;
  searchBy?: SearchByMode;
  exact?: boolean;
}

export interface PluginOptions {
  columns?: UniversalSearchColumnConfig[];
  debounceMs?: number;
  placeholder?: string;
}
