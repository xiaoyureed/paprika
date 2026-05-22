import '@testing-library/jest-dom/vitest' //给测试断言增加 DOM 相关的匹配器，

// 自己实现一个 “空壳版” 的 Mock, 给vitest 的node测试环境打补丁
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock as unknown as typeof ResizeObserver
