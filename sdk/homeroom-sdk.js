/*
 * Homeroom SDK: the bridge between a local game and the Homeroom host page.
 * Include it with a plain script tag (not a module):
 *   <script src="../../sdk/homeroom-sdk.js"></script>
 *
 * API (window.Homeroom):
 *   Homeroom.ready()            tell the host the game has loaded (sent automatically on window load)
 *   Homeroom.score(n)           report a score; the host keeps the best one
 *   Homeroom.save(obj)          store save data (anything JSON-serializable)
 *   Homeroom.load() -> Promise  resolves with the last saved data, or null
 *   Homeroom.on('pause' | 'resume' | 'mute', fn)   host events; 'mute' passes true/false
 *
 * Messages are only exchanged with the parent window on the same origin.
 * A game without the SDK still runs; it just gets no saves or scores.
 */
(function () {
  'use strict';
  if (window.Homeroom) return;

  var origin = window.location.origin;
  var inFrame = window.parent && window.parent !== window;
  var handlers = { pause: [], resume: [], mute: [] };
  var pendingLoads = [];
  var readySent = false;

  function send(msg) {
    if (!inFrame) return;
    window.parent.postMessage(msg, origin);
  }

  function emit(event, value) {
    handlers[event].slice().forEach(function (fn) {
      try { fn(value); } catch (err) { console.warn('Homeroom handler failed', err); }
    });
  }

  function settleLoads(data) {
    var waiting = pendingLoads;
    pendingLoads = [];
    waiting.forEach(function (resolve) { resolve(data); });
  }

  window.addEventListener('message', function (e) {
    // Only trust our own parent, on our own origin.
    if (e.origin !== origin || e.source !== window.parent) return;
    var msg = e.data;
    if (!msg || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'hr:pause': emit('pause'); break;
      case 'hr:resume': emit('resume'); break;
      case 'hr:mute': emit('mute', !!msg.value); break;
      case 'hr:loaded': settleLoads(msg.data === undefined ? null : msg.data); break;
    }
  });

  var api = {
    ready: function () {
      if (readySent) return;
      readySent = true;
      send({ type: 'hr:ready' });
    },
    score: function (value) {
      var n = Number(value);
      if (!isFinite(n)) return;
      send({ type: 'hr:score', value: n });
    },
    save: function (data) {
      // Round-trip through JSON so only plain data crosses the bridge.
      send({ type: 'hr:save', data: JSON.parse(JSON.stringify(data === undefined ? null : data)) });
    },
    load: function () {
      return new Promise(function (resolve) {
        if (!inFrame) { resolve(null); return; }
        pendingLoads.push(resolve);
        send({ type: 'hr:load' });
        // If the host never answers (old host, opened standalone), give up quietly.
        setTimeout(function () {
          var i = pendingLoads.indexOf(resolve);
          if (i !== -1) { pendingLoads.splice(i, 1); resolve(null); }
        }, 3000);
      });
    },
    on: function (event, fn) {
      if (!handlers[event] || typeof fn !== 'function') return function () {};
      handlers[event].push(fn);
      return function () {
        var i = handlers[event].indexOf(fn);
        if (i !== -1) handlers[event].splice(i, 1);
      };
    },
    connected: inFrame
  };

  window.Homeroom = api;

  if (document.readyState === 'complete') api.ready();
  else window.addEventListener('load', function () { api.ready(); });
})();
