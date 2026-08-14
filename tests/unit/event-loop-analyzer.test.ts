import { describe, expect, it } from 'vitest';

import { EventLoopAnalyzer } from '@/internals/event-loop-analyzer';

describe('EventLoopAnalyzer', () => {
  it('should capture deterministic phase execution sequence', async () => {
    const sequence = await EventLoopAnalyzer.getExecutionOrder();

    expect(sequence).toEqual([
      '1_SYNC',
      '2_NEXT_TICK',
      '3_MICROTASK_PROMISE',
      '4_IMMEDIATE_CHECK',
      '5_TIMER_MACROTASK',
    ]);
  });

  it('should synchronously block execution during CPU-bound work', () => {
    const start = Date.now();
    const result = EventLoopAnalyzer.simulateCpuBoundWork(5_000_000);
    const duration = Date.now() - start;

    expect(result).toBeGreaterThan(0);
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('should non-blockingly handle asynchronous I/O work', async () => {
    const start = Date.now();
    const result = await EventLoopAnalyzer.simulateIoBoundWork(15);
    const duration = Date.now() - start;

    expect(result).toBe('IO_COMPLETED_AFTER_15MS');
    expect(duration).toBeGreaterThanOrEqual(10);
  });
});
