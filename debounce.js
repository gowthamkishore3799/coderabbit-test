/**
 * Returns a debounced version of fn that delays invocation until
 * after `wait` ms have elapsed since the last call.
 */
function debounce(fn, wait = 300) {
  let timer = null;

  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  }

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  return debounced;
}

/**
 * Returns a throttled version of fn that invokes at most once per `limit` ms.
 */
function throttle(fn, limit = 300) {
  let lastCall = 0;
  let timer = null;

  return function (...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      clearTimeout(timer);
      lastCall = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}

module.exports = { debounce, throttle };
