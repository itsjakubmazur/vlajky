import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Vývoj bez service workeru – jinak se špatně ladí.
  disable: process.env.NODE_ENV === 'development',
});

export default withSerwist({
  reactStrictMode: true,
  // Aplikace je plně klientská; žádné externí požadavky za běhu.
  images: { unoptimized: true },
});
