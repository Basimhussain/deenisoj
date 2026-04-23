import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

// Each surface writes its strings to its own namespace file so parallel
// translation work doesn't trip over a single messages file. We merge them
// here into the flat namespace map that next-intl expects.
const namespaces = ['common', 'public', 'admin', 'dashboard'] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const loaded = await Promise.all(
    namespaces.map(async (ns) => {
      try {
        const mod = await import(`../messages/${locale}/${ns}.json`);
        return mod.default as Record<string, unknown>;
      } catch {
        return {};
      }
    })
  );

  const messages = loaded.reduce<Record<string, unknown>>(
    (acc, ns) => ({ ...acc, ...ns }),
    {}
  );

  return { locale, messages };
});
