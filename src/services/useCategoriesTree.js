import { useEffect, useState } from "react";
import { fetchTree } from "./categoriesApi";

let cache = null;
let pending = null;
const subscribers = new Set();

function notify() {
  subscribers.forEach((cb) => { try { cb(cache); } catch (e) { /* noop */ } });
}

async function loadOnce() {
  if (pending) return pending;
  pending = fetchTree()
    .then((tree) => {
      cache = Array.isArray(tree) ? tree : [];
      notify();
      return cache;
    })
    .catch((err) => {
      console.error("[useCategoriesTree] fetch tree failed", err);
      cache = [];
      notify();
      return cache;
    });
  return pending;
}

export function useCategoriesTree() {
  const [tree, setTree] = useState(cache || []);
  useEffect(() => {
    if (cache) { setTree(cache); return undefined; }
    const cb = (c) => setTree(c || []);
    subscribers.add(cb);
    loadOnce();
    return () => { subscribers.delete(cb); };
  }, []);
  return tree;
}
