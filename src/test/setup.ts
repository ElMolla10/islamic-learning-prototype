import "@testing-library/jest-dom/vitest";

class IntersectionObserverMock implements IntersectionObserver {
  root = null; rootMargin = "0px"; thresholds = [0];
  disconnect() {} observe() {} takeRecords() { return []; } unobserve() {}
}

Object.defineProperty(window, "IntersectionObserver", { writable: true, value: IntersectionObserverMock });
