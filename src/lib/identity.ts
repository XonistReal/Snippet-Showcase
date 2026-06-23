const KEY = 'snippet-user-id'

/** A stable, anonymous identifier so upvotes can be deduped server-side. */
export function getUserId(): string {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id =
        (crypto.randomUUID?.() ??
          Math.random().toString(36).slice(2) + Date.now().toString(36))
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}
