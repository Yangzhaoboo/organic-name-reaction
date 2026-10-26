import { useEffect, useState } from 'react'

/** 极简 hash 路由：#/ 、#/r/<id> 、#/compare 、#/quiz 、#/fav */
export type Route =
  | { name: 'home' }
  | { name: 'detail'; id: string }
  | { name: 'compare' }
  | { name: 'quiz' }
  | { name: 'fav' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [head, tail] = path.split('/')
  switch (head) {
    case 'r':
      return tail ? { name: 'detail', id: decodeURIComponent(tail) } : { name: 'home' }
    case 'compare':
      return { name: 'compare' }
    case 'quiz':
      return { name: 'quiz' }
    case 'fav':
      return { name: 'fav' }
    default:
      return { name: 'home' }
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export function go(path: string) {
  if (window.location.hash === `#${path}`) return
  window.location.hash = path
  // 切换页面时回到顶部，避免长列表保留滚动位置
  window.scrollTo({ top: 0 })
}
