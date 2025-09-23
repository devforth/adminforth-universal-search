import { AdminForthPlugin, AdminForthResource, IAdminForth, AdminForthDataTypes } from 'adminforth';
import { PluginOptions, UniversalSearchColumnConfig } from './types.js';

export default class UniversalSearchPlugin extends AdminForthPlugin {
  options: PluginOptions;
  resourceConfig!: AdminForthResource;
  adminforth!: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  instanceUniqueRepresentation(_pluginOptions: any): string {
    return 'universal-search';
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.adminforth = adminforth;
    this.resourceConfig = resourceConfig;

    if (!this.resourceConfig.options) this.resourceConfig.options = {} as any;
    if (!this.resourceConfig.options.pageInjections) this.resourceConfig.options.pageInjections = {} as any;
    if (!this.resourceConfig.options.pageInjections.list) this.resourceConfig.options.pageInjections.list = {} as any;

    const columns: UniversalSearchColumnConfig[] | undefined = this.options.columns;
    if (!columns || !columns.length) {
      throw new Error('[UniversalSearchPlugin] Missing required "columns" array in UniversalSearchPlugin options');
    }

    columns.forEach(col => {
      if (col.exact && col.caseSensitive) {
        console.warn(`[UniversalSearchPlugin] Warning: column "${col.name}" has both exact=true and caseSensitive=true. Exact case-sensitive match implemented via LIKE without wildcards.`);
      }
    });

    const virtualFieldName = '_universal_search';
    const ephemeral = true;

    if (!Array.isArray(this.resourceConfig.columns)) this.resourceConfig.columns = [] as any;
    const exists = (this.resourceConfig.columns as any[]).some(c => c.name === virtualFieldName);

    const injection = {
      file: this.componentPath('UniversalSearchInput.vue'),
      meta: {
        thinEnoughToShrinkTable: true,
        pluginInstanceId: this.pluginInstanceId,
        columns: columns.map(col => ({
          name: col.name,
          caseSensitive: col.caseSensitive ?? false,
          searchBy: col.searchBy || 'valueOnly',
          exact: col.exact ?? false,
        })),
        debounceMs: this.options.debounceMs ?? 500,
        placeholder: this.options.placeholder || '',
      }
    };

    const listInjections: any = this.resourceConfig.options.pageInjections.list as any;
    const current = listInjections.beforeActionButtons;
    if (!current) listInjections.beforeActionButtons = [injection];
    else if (Array.isArray(current)) current.push(injection as any);
    else listInjections.beforeActionButtons = [current as any, injection as any];

    if (!this.resourceConfig.hooks) this.resourceConfig.hooks = {} as any;
    if (!this.resourceConfig.hooks.list) this.resourceConfig.hooks.list = {} as any;
    const originalBefore = this.resourceConfig.hooks.list.beforeDatasourceRequest;

    const transformFilters = (filters: any[]): any[] => {
      return filters.flatMap(f => {
        if (!f) return [];
        if (f.operator === 'or' || f.operator === 'and') {
          return [{ ...f, subFilters: transformFilters(f.subFilters || []) }];
        }
        if (f.field === virtualFieldName) {
          const term = (f.value || '').toString().trim();
            if (!term) return [];
            const sub: any[] = [];
            columns.forEach(col => {
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
                sub.push({ field, operator, value });
              };
              if (searchBy === 'valueOnly') addFilter(col.name);
              else if (searchBy === 'keyOnly') addFilter(`${col.name}__key`);
              else if (searchBy === 'both') { addFilter(col.name); addFilter(`${col.name}__key`); }
            });
            if (!sub.length) return [];
            return [{ operator: 'or', subFilters: sub }];
        }
        return [f];
      });
    };

    const transformer = async (ctx: any) => {
      const { query } = ctx;
      if (ephemeral) {
        const term = (query?.body?.__universal_search_term || query?.__universal_search_term || '').toString().trim();
        if (term) {
          const tempFilter = { field: virtualFieldName, operator: 'eq', value: term };
          query.filters = Array.isArray(query.filters) ? [...query.filters, tempFilter] : [tempFilter];
        }
      }
      if (Array.isArray(query?.filters)) {
        query.filters = transformFilters(query.filters);
      }
      return { ok: true, error: '' };
    };

    if (!originalBefore) {
      this.resourceConfig.hooks.list.beforeDatasourceRequest = [transformer];
    } else if (Array.isArray(originalBefore)) {
      originalBefore.push(transformer);
      this.resourceConfig.hooks.list.beforeDatasourceRequest = originalBefore;
    } else {
      this.resourceConfig.hooks.list.beforeDatasourceRequest = [originalBefore, transformer];
    }
  }
}
