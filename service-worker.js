// service-worker.js - 星辰塔罗 PWA 离线缓存
const CACHE_NAME = 'celestial-arcana-v2.4.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './data/tarot-cards.js',
    './data/spreads.js',
    './data/tarot-engine.js',
    './data/app-features.js',
    './data/enhancements.js',
    './data/sound-haptic.js',
    './data/ai-reader.js',
    './data/pet-system.js',
    './data/daily-card.js',
    './data/share-poster.js',
    './data/history-plus.js',
    'https://cdn.tailwindcss.com?plugins=forms,container-queries',
    'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    'https://fonts.gstatic.com/'
];

// 安装事件 - 缓存资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('PWA: 缓存资源');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('PWA: 删除旧缓存', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求 - 优先使用缓存
self.addEventListener('fetch', event => {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 返回缓存的资源
                if (response) {
                    // 后台更新缓存
                    fetchAndCache(event.request);
                    return response;
                }
                
                // 没有缓存，从网络获取
                return fetchAndCache(event.request);
            })
            .catch(() => {
                // 离线且没缓存时的兜底页面
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./AI塔罗牌App需求原型.html');
                }
            })
    );
});

//  fetch 并缓存
function fetchAndCache(request) {
    return fetch(request)
        .then(response => {
            if (!response || response.status !== 200 || response.type === 'opaque') {
                return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
                .then(cache => {
                    cache.put(request, responseToCache);
                });
            
            return response;
        })
        .catch(error => {
            console.log('PWA: 网络请求失败', error);
            return null;
        });
}

// 监听消息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 通知点击 - 把焦点切回 App
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil((async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const target = (event.notification.data && event.notification.data.url) || './index.html';
        for (const client of allClients) {
            if ('focus' in client) {
                client.postMessage({ type: 'OPEN_DAILY_CARD' });
                return client.focus();
            }
        }
        if (self.clients.openWindow) {
            return self.clients.openWindow(target);
        }
    })());
});
