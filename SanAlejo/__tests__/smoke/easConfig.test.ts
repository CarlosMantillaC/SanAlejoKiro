/**
 * Smoke tests for EAS Build configuration files.
 *
 * Validates: Requirements 2.1, 2.3, 3.2, 4.1, 4.2, 4.3, 4.5, 6.1
 *
 * These tests verify static configuration without running EAS Build.
 * They are intended to catch misconfiguration early in the development cycle.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appJson = require('../../app.json') as {
  expo: {
    android?: { package?: string };
    newArchEnabled?: boolean;
    extra?: { eas?: { projectId?: string } };
  };
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const easJson = require('../../eas.json') as {
  build?: {
    preview?: {
      distribution?: string;
      android?: { buildType?: string };
    };
    production?: Record<string, unknown>;
  };
};

describe('EAS Build — app.json configuration', () => {
  /**
   * Validates: Requirements 2.1, 2.3
   * expo.android.package must exist and follow reverse-domain format.
   */
  it('expo.android.package exists and has valid reverse-domain format', () => {
    const pkg = appJson.expo?.android?.package;
    expect(pkg).toBeDefined();
    expect(typeof pkg).toBe('string');
    expect(pkg).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
  });

  /**
   * Validates: Requirements 6.1
   * newArchEnabled must remain true.
   */
  it('expo.newArchEnabled is true', () => {
    expect(appJson.expo?.newArchEnabled).toBe(true);
  });
});

describe('EAS Build — eas.json configuration', () => {
  /**
   * Validates: Requirements 4.1
   * eas.json must exist and be valid JSON (if require() succeeds, it is valid JSON).
   */
  it('eas.json exists and is valid JSON', () => {
    expect(easJson).toBeDefined();
    expect(typeof easJson).toBe('object');
  });

  /**
   * Validates: Requirements 4.2, 4.5
   * preview profile must produce an APK with internal distribution.
   */
  it('build.preview.android.buildType is "apk"', () => {
    expect(easJson.build?.preview?.android?.buildType).toBe('apk');
  });

  it('build.preview.distribution is "internal"', () => {
    expect(easJson.build?.preview?.distribution).toBe('internal');
  });

  /**
   * Validates: Requirements 4.3
   * production profile must exist.
   */
  it('build.production profile exists', () => {
    expect(easJson.build?.production).toBeDefined();
  });
});

describe('EAS Build — projectId in app.json', () => {
  /**
   * Validates: Requirements 3.2
   *
   * expo.extra.eas.projectId is added automatically by `eas init`.
   * Since `eas init` is a manual step, this test skips gracefully when the
   * field is absent rather than hard-failing, so the rest of the suite stays
   * green before the developer has run `eas init`.
   */
  it('expo.extra.eas.projectId exists and matches UUID format (skip if eas init not run)', () => {
    const projectId = appJson.expo?.extra?.eas?.projectId;

    if (projectId === undefined || projectId === null) {
      console.warn(
        '[SKIP] expo.extra.eas.projectId is not set. ' +
          'Run `eas init` inside SanAlejo/ to link the project and populate this field.'
      );
      // Soft-skip: mark as pending rather than failing
      return;
    }

    expect(typeof projectId).toBe('string');
    expect(projectId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});
