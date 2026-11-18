import { describe, it, expect } from 'vitest';
import {
  isPublicSite,
  toPublicEntry,
  toPublicSite,
} from '../../../../src/modules/content/delivery.routes.js';

describe('public delivery', () => {
  it('serves a site only when its owner switched it on', () => {
    expect(
      isPublicSite({ fields: [], metadata: { publicWebsite: true } }),
    ).toBe(true);
    expect(isPublicSite({ fields: [], metadata: {} })).toBe(false);
    expect(isPublicSite({ fields: [] })).toBe(false);
    expect(
      isPublicSite({ fields: [], metadata: { publicWebsite: 'true' } }),
    ).toBe(false);
  });
  it('returns the published snapshot and no private details', () => {
    const out = toPublicEntry({
      id: '1',
      status: 'draft',
      data: { title: 'Edited, not live' },
      publishedData: { title: 'Live' },
      updatedBy: 'someone@example.com',
      collaborators: 'x',
    } as never);
    expect(out!.data).toEqual({ title: 'Live' });
    expect(JSON.stringify(out)).not.toContain('someone@example.com');
    expect(JSON.stringify(out)).not.toContain('Edited');
  });
  it('shares only visitor-facing site details', () => {
    const site = toPublicSite('My Blog', {
      fields: [],
      metadata: {
        logoUrl: 'x.png',
        domain: 'a.com',
        maintenanceMode: true,
        seo: { titleTemplate: '%page%', description: 'd' },
        secretNote: 'no',
      },
    });
    expect(site.logoUrl).toBe('x.png');
    expect(JSON.stringify(site)).not.toContain('secretNote');
    expect(JSON.stringify(site)).not.toContain('maintenanceMode');
  });
  it('never publishes form messages, and strips emails from comments', () => {
    const form = toPublicEntry({
      id: 'f',
      data: {
        kind: 'submission',
        submissionType: 'form',
        fields: { email: 'a@b.c' },
      },
    } as never);
    expect(form).toBeNull();
    const comment = toPublicEntry({
      id: 'c',
      data: {
        kind: 'submission',
        submissionType: 'comment',
        name: 'Ann',
        email: 'a@b.c',
        message: 'Nice',
        postSlug: 'p',
      },
    } as never);
    expect(comment!.data).toMatchObject({ name: 'Ann', message: 'Nice' });
    expect(JSON.stringify(comment)).not.toContain('a@b.c');
  });
});
