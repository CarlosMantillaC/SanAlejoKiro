type Callback = (...args: any[]) => void;

const listeners: Map<string, Set<Callback>> = new Map();

export function subscribe(event: string, cb: Callback) {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(cb);
  return () => set && set.delete(cb);
}

export function publish(event: string, ...args: any[]) {
  const set = listeners.get(event);
  if (!set) return;
  for (const cb of Array.from(set)) {
    try { cb(...args); } catch (e) { /* ignore */ }
  }
}
