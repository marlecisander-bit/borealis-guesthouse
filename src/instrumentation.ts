export async function register() {
  if (process.env.BOREALIS_READONLY_PREVIEW !== undefined || process.env.NEXT_PUBLIC_BOREALIS_READONLY_PREVIEW !== undefined) {
    const { assertPreviewEnvironment, guardedFetch } = await import('./lib/readonly-preview/policy');
    assertPreviewEnvironment();
    globalThis.fetch = guardedFetch(globalThis.fetch.bind(globalThis));
  }
}
