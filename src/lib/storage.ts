import { useEffect, useState } from 'react'

/** 简易 localStorage 状态：读写 JSON，跨标签页自动同步（storage 事件） */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* 隐私模式下写入失败时忽略 */
    }
  }, [key, value])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || !e.newValue) return
      try {
        setValue(JSON.parse(e.newValue) as T)
      } catch {
        /* 忽略损坏的数据 */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [value, setValue] as const
}

export const STORAGE_KEYS = {
  favorites: 'nrs.favorites',
  learned: 'nrs.learned',
  quiz: 'nrs.quizMarks',
  compare: 'nrs.compare',
} as const
