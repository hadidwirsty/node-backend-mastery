import { describe, expect, it } from 'vitest';

import { createApp } from '@/app';

describe('Server Initialization', () => {
  it('should instantiate Express app without throwing', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});
