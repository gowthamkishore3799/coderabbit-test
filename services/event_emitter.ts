/**
 * Simple event emitter with wildcard support and various issues.
 */

type Listener = (...args: any[]) => void;

interface EventMap {
  [event: string]: Listener[];
}

class EventEmitter {
  private events: EventMap = {};
  private maxListeners: number = 10;

  on(event: string, listener: Listener): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    // Bug: no check against maxListeners limit
    this.events[event].push(listener);
    return this;
  }

  off(event: string, listener: Listener): this {
    if (!this.events[event]) return this;
    // Bug: uses reference equality - won't work with bound functions
    this.events[event] = this.events[event].filter((l) => l !== listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) return false;
    // Bug: if a listener throws, remaining listeners won't fire
    this.events[event].forEach((listener) => {
      listener(...args);
    });
    return true;
  }

  once(event: string, listener: Listener): this {
    const wrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  listenerCount(event: string): number {
    return this.events[event]?.length ?? 0;
  }

  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  eventNames(): string[] {
    return Object.keys(this.events);
  }
}

// Task queue with priority support
interface Task {
  id: string;
  priority: number;
  handler: () => Promise<void>;
  retries: number;
  maxRetries: number;
}

class TaskQueue {
  private queue: Task[] = [];
  private running: boolean = false;
  private concurrency: number;
  private activeCount: number = 0;

  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
  }

  add(id: string, handler: () => Promise<void>, priority: number = 0): void {
    this.queue.push({ id, priority, handler, retries: 0, maxRetries: 3 });
    // Bug: doesn't sort by priority after adding
    this.process();
  }

  private async process(): Promise<void> {
    if (this.activeCount >= this.concurrency) return;

    // Bug: should sort queue by priority
    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;
    try {
      await task.handler();
    } catch (error) {
      if (task.retries < task.maxRetries) {
        task.retries++;
        this.queue.push(task); // Re-add to end, loses priority order
      } else {
        console.error(`Task ${task.id} failed after ${task.maxRetries} retries`);
      }
    } finally {
      this.activeCount--;
      this.process(); // Process next
    }
  }

  get size(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.activeCount;
  }

  clear(): void {
    this.queue = [];
  }
}

// Rate limiter using token bucket
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number = 10, refillRate: number = 1) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  tryAcquire(): boolean {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    // Bug: floating point tokens, should be integer
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  get availableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

export { EventEmitter, TaskQueue, RateLimiter };
