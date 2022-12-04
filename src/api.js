const API_KEY =
  'e390a8060a7fe7725490dce7417577c1d291d26e3c20e31509612f3d689f5d05';
const url = new URL('wss://streamer.cryptocompare.com/v2');
url.searchParams.set('api_key', API_KEY);
const AGGREGATE_INDEX = '5';
const INVALID = '500';

const tickersHandlers = new Map();
const socket = new WebSocket(url);

let btcToUsd = null;
subscribeTickerOnWs('BTC');

socket.addEventListener('message', function (e) {
  const {
    TYPE: type,
    FROMSYMBOL: fromSymbol,
    TOSYMBOL: toSymbol,
    PRICE: newPrice,
    PARAMETER: parameter,
  } = JSON.parse(e.data);

  if (fromSymbol === 'BTC') btcToUsd = newPrice;

  if (type === INVALID) {
    const parameterArr = parameter.split('~');
    const ticker = parameterArr[parameterArr.length - 2];

    if (fromSymbol === 'BTC') return;
    subscribeTickerOnWs(ticker, 'BTC');
    return;
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) return;
  const subscribers = tickersHandlers.get(fromSymbol);
  if (!subscribers) return;
  subscribers.forEach((fn) => {
    if (toSymbol === 'BTC') {
      fn(newPrice * btcToUsd);
      return;
    }

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

export function subscribeTicker(tickerName, cb = []) {
  const subscribers = tickersHandlers.get(tickerName) || [];
  tickersHandlers.set(tickerName, [...subscribers, cb]);
  subscribeTickerOnWs(tickerName);
}
function subscribeTickerOnWs(tickerName, currency = 'USD') {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${tickerName}~${currency}`],
  });
}

export function unSubscribeTicker(tickerName) {
  tickersHandlers.delete(tickerName);
  unSubscribeTickerOnWs(tickerName);
}
function unSubscribeTickerOnWs(tickerName, currency = 'USD') {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${tickerName}~${currency}`],
  });
}
