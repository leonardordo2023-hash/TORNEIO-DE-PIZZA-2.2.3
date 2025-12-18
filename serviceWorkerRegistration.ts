
export function register(config?: any) {
  // Safe check for production environment to avoid "Script redirected to external origin" in dev/preview
  const isProduction = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';

  if (isProduction && 'serviceWorker' in navigator) {
    // Use relative path to avoid origin issues in non-root deployments
    const swUrl = './sw.js';

    const onWindowLoad = () => {
      const isLocalhost = Boolean(
        window.location.hostname === 'localhost' ||
          // [::1] is the IPv6 localhost address.
          window.location.hostname === '[::1]' ||
          // 127.0.0.0/8 are considered localhost for IPv4.
          window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
          ) ||
          // Treat Google Cloud Shell / IDX preview domains as localhost to force validation
          window.location.hostname.includes('usercontent.goog')
      );

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://bit.ly/CRA-PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    };

    // If the page is already loaded, register immediately
    if (document.readyState === 'complete') {
        onWindowLoad();
    } else {
        window.addEventListener('load', onWindowLoad);
    }
  }
}

function registerValidSW(swUrl: string, config?: any) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log(
                'New content is available and will be used when all ' +
                  'tabs for this page are closed. See https://bit.ly/CRA-PWA.'
              );

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Content is cached for offline use.');

              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      // Suppress specific origin mismatch error which occurs in some preview environments
      // where 404s redirect to a different domain (e.g. ai.studio)
      if (error.message && (
          error.message.includes('does not match the current origin') || 
          error.message.includes('The origin of the provided scriptURL') ||
          error.message.includes('redirected to external origin')
      )) {
          // Silent return or debug log only
          // console.debug('Service Worker registration skipped: Script redirected to external origin.');
          return;
      }
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: any) {
  // Check if the service worker can be found.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      
      // CRITICAL FIX: Check if the response was redirected to a different origin
      const isRedirectedToDifferentOrigin = response.redirected || (response.url && new URL(response.url).origin !== window.location.origin);

      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1) ||
        isRedirectedToDifferentOrigin
      ) {
        // No service worker found. Probably a different app or redirect.
        // Simply unregister existing workers. Do NOT reload to avoid loops.
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for(let registration of registrations) {
                registration.unregister();
            }
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'No internet connection found. App is running in offline mode.'
      );
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
