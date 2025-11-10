/**
 * Small utilities to reduce repeated patterns in resolvers.
 * removeById mutates the array (splice) and returns the removed item.
 * findById is a typed wrapper for .find.
 */
export function removeById<T extends { id: string }>(arr: T[], id: string) {
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return { removed: null as T | null, arr };
  const [removed] = arr.splice(idx, 1);
  return { removed, arr };
}

export function findById<T extends { id: string }>(arr: T[], id: string) {
  return arr.find((x) => x.id === id) || null;
}

/**
 * Create an AsyncIterator for a pubsub-like object.
 * - If pubsub.asyncIterator exists use it.
 * - If pubsub.subscribe(publishName, handler) exists, wrap it into an AsyncIterator.
 */
export function toAsyncIterator<T = any>(
  pubsub: any,
  trigger: string | string[]
): AsyncIterator<T> {
  if (typeof pubsub?.asyncIterator === "function") {
    return pubsub.asyncIterator(trigger) as AsyncIterator<T>;
  }

  if (typeof pubsub?.subscribe === "function") {
    const triggers = Array.isArray(trigger) ? trigger : [trigger];
    const queue: T[] = [];
    let pullResolve: ((v: IteratorResult<T>) => void) | null = null;
    let closed = false;

    const handlers: (() => void)[] = [];

    // subscribe to all triggers
    for (const t of triggers) {
      const unsub = pubsub.subscribe(t, (payload: T) => {
        if (closed) return;
        if (pullResolve) {
          pullResolve({ value: payload, done: false });
          pullResolve = null;
        } else {
          queue.push(payload);
        }
      });

      // Normalize unsubscribe to a function:
      if (typeof unsub === "function") {
        handlers.push(unsub);
      } else if (unsub && typeof unsub.unsubscribe === "function") {
        handlers.push(() => unsub.unsubscribe());
      } else if (unsub && typeof unsub.then === "function") {
        // some APIs return a Promise; handle resolution
        handlers.push(() => {
          try {
            (unsub as Promise<any>)
              .then((r) => {
                if (r && typeof r.unsubscribe === "function") r.unsubscribe();
                else if (typeof r === "function") r();
              })
              .catch((e) => {
                console.warn(
                  "toAsyncIterator: failed to resolve unsubscribe promise",
                  e
                );
              });
          } catch (e) {
            console.warn(
              "toAsyncIterator: error during unsubscribe promise handling",
              e
            );
          }
        });
      } else {
        // fallback no-op to keep handlers index aligned
        handlers.push(() => {
          // nothing to unsubscribe
        });
      }
    }

    // change the declared type to AsyncIterableIterator<T> so the symbol method is allowed
    const iterator: AsyncIterableIterator<T> = {
      async next() {
        if (queue.length) {
          return { value: queue.shift() as T, done: false };
        }
        if (closed) return { value: undefined as any, done: true };
        return new Promise<IteratorResult<T>>((resolve) => {
          pullResolve = resolve;
        });
      },
      return() {
        closed = true;
        handlers.forEach((u) => {
          try {
            if (typeof u === "function") u();
            else
              console.warn(
                "toAsyncIterator: handler is not a function on return()",
                u
              );
          } catch (err) {
            // log unsubscribe errors so they are visible in production diagnostics
            console.warn("toAsyncIterator: unsubscribe handler threw", err);
          }
        });
        if (pullResolve) {
          pullResolve({ value: undefined as any, done: true });
          pullResolve = null;
        }
        return Promise.resolve({ value: undefined as any, done: true });
      },
      throw(err) {
        closed = true;
        handlers.forEach((u) => {
          try {
            if (typeof u === "function") u();
            else
              console.warn(
                "toAsyncIterator: handler is not a function on throw()",
                u
              );
          } catch (unsubErr) {
            console.warn(
              "toAsyncIterator: unsubscribe threw during throw()",
              unsubErr
            );
          }
        });
        return Promise.reject(err);
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
    return iterator;
  }

  throw new Error("PubSub does not support asyncIterator or subscribe.");
}
