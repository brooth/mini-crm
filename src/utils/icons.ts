import type { IconName } from "@blueprintjs/core";


/**
 * Mapping of module-specific semantic icon names to Blueprint.js icon names.
 * Used by normalizeIconName to convert @module names to actual icon names.
 */
const MODULE_ICON_MAP = {
  'object': 'office',
  'task': 'tick-circle',
  'myTasks': 'person',
  'history': 'history',
} as const;

/**
 * Module-specific icon name with @ prefix (e.g., @user, @chat, @pricing)
 */
export type ModuleIconName = `@${keyof typeof MODULE_ICON_MAP}`;

/**
 * Extended icon name that can be either a regular Blueprint icon name
 * or a module-specific icon name with @ prefix
 */
export type ExtendedIconName = IconName | ModuleIconName;

/**
 * Normalizes icon names by mapping module-specific icons (with @ prefix)
 * to Blueprint.js icon names.
 *
 * @param icon - Icon name, optionally prefixed with @ for module icons
 * @returns Blueprint.js icon name, or undefined if input is undefined
 *
 * @example
 * normalizeIconName('@user')      // => 'people'
 * normalizeIconName('@chat')      // => 'chat'
 * normalizeIconName('chart')      // => 'chart' (pass-through)
 * normalizeIconName(undefined)    // => undefined
 */
export function normalizeIconName(
  icon: ExtendedIconName | undefined
): IconName | undefined {
  if (!icon) return undefined;

  if (typeof icon === 'string' && icon.startsWith('@')) {
    const moduleName = icon.slice(1) as keyof typeof MODULE_ICON_MAP;
    const mappedIcon = MODULE_ICON_MAP[moduleName];

    if (!mappedIcon && process.env.NODE_ENV === 'development') {
      console.warn(`Module icon not found in mapping: ${icon}`);
    }

    return mappedIcon || (icon.slice(1) as IconName);
  }

  return icon as IconName;
}
