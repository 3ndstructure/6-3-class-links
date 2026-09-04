// 통합 서비스 워커: OneSignal 푸시 알림 + 오프라인 대비 캐싱
// (OneSignalSDKWorker.js와 sw.js가 같은 범위에서 서로 덮어쓰던 충돌을 해결하기 위해 하나로 합침)

try {
    importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
    // OneSignal CDN 접속 실패 시에도 캐싱 기능은 정상 동작하도록 함
}

const CACHE_NAME = 'class-links-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // 새 버전 즉시 활성화
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // 이전 버전 캐시 정리
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        await clients.claim();
    })());
});

// 항상 네트워크에서 최신 버전을 받아오고(브라우저 HTTP 캐시까지 무시),
// 성공한 응답은 저장해 두었다가 오프라인일 때만 사용
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 우리 사이트의 GET 요청만 처리 (OneSignal 등 외부 요청은 그대로 통과)
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

    event.respondWith((async () => {
        try {
            // cache: 'no-store' → 브라우저/프록시 캐시를 거치지 않고 항상 서버에서 새로 받음
            const fresh = await fetch(new Request(url.href, { cache: 'no-store' }));
            if (fresh && fresh.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(url.pathname, fresh.clone()); // 쿼리스트링(?ts=...)은 빼고 저장
            }
            return fresh;
        } catch (e) {
            // 오프라인: 마지막으로 저장된 버전 반환
            const cached = await caches.match(url.pathname);
            if (cached) return cached;
            throw e;
        }
    })());
});
