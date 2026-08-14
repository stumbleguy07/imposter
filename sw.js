const CACHE_NAME = "impostor-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json"
];

// Instalacja Service Workera
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })
    );

    self.skipWaiting();
});

// Aktywacja
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

// Obsługa żądań
self.addEventListener("fetch", event => {

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(response => {

                        // Nie zapisujemy błędnych odpowiedzi
                        if (
                            !response ||
                            response.status !== 200 ||
                            response.type !== "basic"
                        ) {
                            return response;
                        }

                        const responseClone =
                            response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(
                                    event.request,
                                    responseClone
                                );
                            });

                        return response;
                    })
                    .catch(() => {

                        // Jeśli nie ma internetu,
                        // spróbuj pokazać index.html
                        return caches.match(
                            "./index.html"
                        );

                    });

            })
    );
});
