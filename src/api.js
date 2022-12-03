const API_KEY =
  'e390a8060a7fe7725490dce7417577c1d291d26e3c20e31509612f3d689f5d05';
const url = new URL('wss://streamer.cryptocompare.com/v2');
url.searchParams.set('api_key', API_KEY);
const AGGREGATE_INDEX = '5';

const tickersHandlers = new Map();
const socket = new WebSocket(url);

socket.addEventListener('message', function (e) {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
  } = JSON.parse(e.data);

  if (type !== AGGREGATE_INDEX || newPrice === undefined) return;

  const subscribers = tickersHandlers.get(currency);
  subscribers.forEach((fn) => {
    fn(newPrice);
  });
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
  }

  socket.addEventListener(
    'open',
    function () {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

export function subscribeTicker(tickerName, cb) {
  const subscribers = tickersHandlers.get(tickerName) || [];
  tickersHandlers.set(tickerName, [...subscribers, cb]);
  subscribeTickerOnWs(tickerName);
}
function subscribeTickerOnWs(tickerName) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${tickerName}~USD`],
  });
}

export function unSubscribeTicker(tickerName) {
  tickersHandlers.delete(tickerName);
  unSubscribeTickerOnWs(tickerName);
}
function unSubscribeTickerOnWs(tickerName) {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${tickerName}~USD`],
  });
}
