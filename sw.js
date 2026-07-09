/* Service worker del Diario: dopo il primo avvio l'app funziona anche offline.
   - la pagina: rete prima, cache di riserva
   - le librerie CDN (Chart.js, scanner): cache prima, rete di riserva */
const CACHE="diario-v1";
const CDN=[
 "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.js",
 "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js"
];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CDN.map(u=>c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.hostname==="cdn.jsdelivr.net"){ // librerie: cache-first
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
      const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return res;})));
    return;
  }
  if(e.request.mode==="navigate"){ // pagina: network-first con riserva in cache
    e.respondWith(fetch(e.request).then(res=>{
      const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));return res;
    }).catch(()=>caches.match(e.request)));
  }
});
