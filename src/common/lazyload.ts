export default function lazyLoad<T, P extends unknown[]> (originalFunction: (...p: P) => T, ...params: P): () => T {
  let result: T | null = null
  return () => {
    if (result === null) {
      result = originalFunction(...params)
    }
    return result
  }
}
