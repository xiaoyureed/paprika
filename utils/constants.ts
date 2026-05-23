export const STORAGE_KEYS = {
  formData: 'formData',
  prompts: 'prompts',
}

export const SHORTCUTS = {
  openPalette: 'open-palette',
}

/** 超过此阈值启用虚拟滚动，否则使用 cmdk 原生列表 */
export const BOOKMARK_VIRTUAL_THRESHOLD = 50
/** 搜索防抖延迟（ms） */
export const BOOKMARK_SEARCH_DEBOUNCE = 300
/** 虚拟滚动 overscan 行数 */
export const BOOKMARK_VIRTUAL_OVERSCAN = 10
