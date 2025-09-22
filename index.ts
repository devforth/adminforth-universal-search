import { AdminForthPlugin, AdminForthResource, IAdminForth } from 'adminforth';
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
      }
    };

    const listInjections: any = this.resourceConfig.options.pageInjections.list as any;
    const current = listInjections.beforeActionButtons;
    if (!current) listInjections.beforeActionButtons = [injection];
    else if (Array.isArray(current)) current.push(injection as any);
    else listInjections.beforeActionButtons = [current as any, injection as any];
  }
}
