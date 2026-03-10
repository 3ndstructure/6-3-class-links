// 캐시 버전을 정의합니다 (코드 수정 시 이름 변경 불필요)
const CACHE_NAME = 'class-links-v1';

// 서비스 워커 설치 이벤트
self.addEventListener('install', (event) => {
    self.skipWaiting(); // 즉시 활성화
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// 네트워크 요청 시: 선생님이 HTML을 수정하면 실시간으로 반영되도록 항상 네트워크에서 최신 버전을 가져옵니다.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request); // 오프라인일 때만 캐시를 찾음
        })
    );
});