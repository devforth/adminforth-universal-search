import { AdminForthPlugin, AdminForthResource, IAdminForth, AdminForthDataTypes, Filters } from 'adminforth';
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
    return `${this.resourceConfig.resourceId}-universal-search`;
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
    if (!exists) {
      (this.resourceConfig.columns as any[]).push({
        name: virtualFieldName,
        virtual: true,
        type: AdminForthDataTypes.STRING,
        label: 'Universal Search',
        showIn: { all: false },
      });
    }

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

const VIRTUAL_FIELD = '_universal_search';

const transformFilters = (filters: any[]): any[] => {
  return (filters ?? []).flatMap(f => {
    if (!f) return [];
    const op = String(f.operator ?? '').toLowerCase();
    if (op === 'or' || op === 'and') {
      return [{ ...f, subFilters: transformFilters(f.subFilters || []) }];
    }
    if (f.field === VIRTUAL_FIELD) {
      const term = String(f.value ?? '').trim();
      if (!term) return [];
      const sub: any[] = [];

      for (const col of columns) {
        const searchBy = (col.searchBy === 'labelOnly' ? 'keyOnly' : col.searchBy) || 'valueOnly';
        const add = (field: string) => {
          if (col.exact) {
            if (col.caseSensitive) sub.push(Filters.LIKE(field, term));      
            else sub.push(Filters.EQ(field, term)); 
          } else {
            const likeVal = `${term}`;
            if (col.caseSensitive) sub.push(Filters.LIKE(field, likeVal));
            else if ((Filters as any).ILIKE) sub.push((Filters as any).ILIKE(field, likeVal));
            else sub.push(Filters.LIKE(field, likeVal));
          }
        };
        if (searchBy === 'valueOnly') add(col.name);
        else if (searchBy === 'keyOnly') add(`${col.name}__key`);
        else { add(col.name); add(`${col.name}__key`); }
      }

      if (!sub.length) return [];
      return [Filters.OR(...sub)];
    }
    return [f];
  });
};

const transformer = async ({ query }: { query: any }) => {
  const term = String(
    (query?.body?.__universal_search_term ??
     query?.__universal_search_term ??
     (global as any).__universal_search_term ??
     '')
  ).trim();

  const incoming = Array.isArray(query?.filters)
    ? query.filters
    : Array.isArray(query?.body?.filters)
      ? query.body.filters
      : [];

  const withVirtual = term
    ? [...incoming, { field: VIRTUAL_FIELD, operator: 'eq', value: term }]
    : incoming;

  const transformed = transformFilters(withVirtual);

  query.filters = transformed;
  query.body = { ...(query.body || {}), filters: transformed };

  if (query.body.__universal_search_term !== undefined) {
    delete query.body.__universal_search_term;
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
