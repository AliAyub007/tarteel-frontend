import { sync as globSync } from 'glob';
import appRootDir from 'app-root-dir';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import OfflinePlugin from 'offline-plugin';

import config from '../../../config';

import ClientConfig from '../../../config/components/ClientConfig';

export default function withServiceWorker(webpackConfig, bundleConfig) {
  if (!config('serviceWorker.enabled')) {
    return webpackConfig;
  }

  // urls that we want to explitly cache for offline support
  const otherUrls = [
    'https://cdn.polyfill.io/v2/polyfill.min.js?features=Intl.~locale.en ',
    'https://www.tarteel.io/public/fonts/ProximaNova/Mark%20Simonson%20-%20Proxima%20Nova%20Alt%20Regular-webfont.ttf',
    'https://www.tarteel.io/public/manifest.json',
  ];

  let externalsConfig = ['/']
    .concat(
      config('polyfillIO.enabled')
        ? [
            `${config('polyfillIO.url')}?features=${config(
              'polyfillIO.features'
            ).join(',')}`,
          ]
        : []
    )
    .concat(
      config('serviceWorker.includePublicAssets').reduce((acc, cur) => {
        const publicAssetPathGlob = path.resolve(
          appRootDir.get(),
          config('publicAssetsPath'),
          cur
        );
        const publicFileWebPaths = acc.concat(
          // First get all the matching public folder files.
          globSync(publicAssetPathGlob, { nodir: true })
            // Then map them to relative paths against the public folder.
            // We need to do this as we need the "web" paths for each one.
            .map(publicFile =>
              path.relative(
                path.resolve(appRootDir.get(), config('publicAssetsPath')),
                publicFile
              )
            )
            // Add the leading "/" indicating the file is being hosted
            // off the root of the application.
            .map(relativePath => `/${relativePath}`)
        );

        return publicFileWebPaths;
      }, [])
    )
    .concat(otherUrls);

  // remove Ayah fonts. The size of these is massive and makes the PWA size big
  // .filter is run at build time so it doesn't slow down the website
  externalsConfig = externalsConfig.filter(a => !a.includes('/fonts/ayahs'));

  // Offline Page generation.
  //
  // We use the HtmlWebpackPlugin to produce an "offline" html page that
  // can be used by our service worker (see the OfflinePlugin below) in
  // order support offline rendering of our application.
  // We will only create the service worker required page if enabled in
  // config and if we are building the production version of client.
  webpackConfig.plugins.push(
    new HtmlWebpackPlugin({
      filename: config('serviceWorker.offlinePageFileName'),
      template: `babel-loader!${path.resolve(
        __dirname,
        './offlinePageTemplate.js'
      )}`,
      allChunks: true,
      production: true,
      chunksSortMode: 'dependency',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeNilAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: true,
      // We pass our config and client config script compoent as it will
      // be needed by the offline template.
      custom: {
        config,
        ClientConfig,
      },
    })
  );

  // We use the offline-plugin to generate the service worker.  It also
  // provides a runtime installation script which gets executed within
  // the client.
  // @see https://github.com/NekR/offline-plugin
  //
  // This plugin generates a service worker script which as configured below
  // will precache all our generated client bundle assets as well as our
  // static "public" folder assets.
  //
  // It has also been configured to make use of a HtmlWebpackPlugin
  // generated "offline" page so that users can still used the application
  // offline.
  //
  // Any time our static files or generated bundle files change the user's
  // cache will be updated.
  //
  // We will only include the service worker if enabled in config.
  webpackConfig.plugins.push(
    new OfflinePlugin({
      // Setting this value lets the plugin know where our generated client
      // assets will be served from.
      // e.g. /client/
      publicPath: bundleConfig.webPath,
      // When using the publicPath we need to disable the "relativePaths"
      // feature of this plugin.
      relativePaths: false,
      // Our offline support will be done via a service worker.
      // Read more on them here:
      // http://bit.ly/2f8q7Td
      ServiceWorker: {
        // The name of the service worker script that will get generated.
        output: config('serviceWorker.fileName'),
        // Enable events so that we can register updates.
        events: true,
        // By default the service worker will be ouput and served from the
        // publicPath setting above in the root config of the OfflinePlugin.
        // This means that it would be served from /client/sw.js
        // We do not want this! Service workers have to be served from the
        // root of our application in order for them to work correctly.
        // Therefore we override the publicPath here. The sw.js will still
        // live in at the /build/client/sw.js output location therefore in
        // our server configuration we need to make sure that any requests
        // to /sw.js will serve the /build/client/sw.js file.
        publicPath: `/${config('serviceWorker.fileName')}`,
        // When the user is offline then this html page will be used at
        // the base that loads all our cached client scripts.  This page
        // is generated by the HtmlWebpackPlugin above, which takes care
        // of injecting all of our client scripts into the body.
        // Please see the HtmlWebpackPlugin configuration above for more
        // information on this page.
        navigateFallbackURL: `${bundleConfig.webPath}${config(
          'serviceWorker.offlinePageFileName'
        )}`,
      },
      // According to the Mozilla docs, AppCache is considered deprecated.
      // @see https://mzl.la/1pOZ5wF
      // It does however have much wider support compared to the newer
      // Service Worker specification, so you could consider enabling it
      // if you needed.
      AppCache: false,
      // Which external files should be included with the service worker?
      // Add the polyfill io script as an external if it is enabled.
      externals: externalsConfig,
    })
  );

  return webpackConfig;
}
