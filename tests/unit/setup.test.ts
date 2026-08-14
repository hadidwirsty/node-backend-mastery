import { describe, expect, it } from 'vitest';

describe('Project Tooling Setup', () => {
  it('should execute vitest and confirm typescript environment is active', () => {
    const environment: string = 'typescript-node-backend';
    expect(environment).toBe('typescript-node-backend');
  });
});
