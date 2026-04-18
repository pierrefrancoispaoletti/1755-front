import { useEffect, useState } from "react";
import { fetchTree } from "./categoriesApi";
import { treeToLegacy } from "./categoriesAdapter";

// Fetch unique de /api/categories?tree=1, transformé au format legacy,
// puis broadcasté à tous les composants abonnés. Les consommateurs
// remplacent juste `import categories from ".../datas/categories"`
// par `const categories = useCategories();`.

let cache = null;
let pending = null;
const subscribers = new Set();

function notify() {
  subscribers.forEach((cb) => {
    try { cb(cache); } catch (e) { /* noop */ }
  });
}

async function loadOnce() {
  if (pending) return pending;
  pending = fetchTree()
    .then((tree) => {
      cache = treeToLegacy(tree);
      notify();
      return cache;
    })
    .catch((err) => {
      console.error("[useCategories] fetch tree failed", err);
      cache = [];
      notify();
      return cache;
    });
  return pending;
}

export function invalidateCategoriesCache() {
  cache = null;
  pending = null;
  loadOnce();
}

export function useCategories() {
  const [cats, setCats] = useState(cache || []);

  useEffect(() => {
    if (cache) {
      setCats(cache);
      return undefined;
    }
    const cb = (c) => setCats(c || []);
    subscribers.add(cb);
    loadOnce();
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  return cats;
}
