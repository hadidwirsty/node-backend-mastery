export class EventLoopAnalyzer {
  public static getExecutionOrder(): Promise<string[]> {
    return new Promise((resolve) => {
      // Start within an isolated macrotask tick to decouple from caller microtask queues
      setImmediate(() => {
        const records: string[] = [];

        // 1. Timer macrotask (Timers Phase)
        setTimeout(() => {
          records.push('5_TIMER_MACROTASK');
          resolve(records);
        }, 10);

        // 2. Check macrotask (Check Phase)
        setImmediate(() => {
          records.push('4_IMMEDIATE_CHECK');
        });

        // 3. Microtask Promise
        Promise.resolve().then(() => {
          records.push('3_MICROTASK_PROMISE');
        });

        // 4. Microtask process.nextTick
        process.nextTick(() => {
          records.push('2_NEXT_TICK');
        });

        // 5. Synchronous execution
        records.push('1_SYNC');
      });
    });
  }

  /**
   * Simulates a CPU-bound intensive calculation that synchronously blocks the Event Loop.
   */
  public static simulateCpuBoundWork(iterations: number = 10_000_000): number {
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }

  /**
   * Simulates an asynchronous I/O-bound operation that delegates to libuv/timers without blocking the Event Loop.
   */
  public static async simulateIoBoundWork(delayMs: number = 20): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`IO_COMPLETED_AFTER_${delayMs}MS`);
      }, delayMs);
    });
  }
}
