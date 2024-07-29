const timers = {};

function startTimer(domain, timeLimit) {
  console.log(`Setting timer for ${domain} with limit ${timeLimit} minutes`);

  if (!timers[domain]) {
    console.log(`Initializing timer for ${domain}`);
    timers[domain] = { startTime: Date.now(), timer: null };
  }

  if (timers[domain].timer) {
    clearInterval(timers[domain].timer);
    console.log(`Cleared existing timer for ${domain}`);
  }

  const timeLimitMs = timeLimit * 60 * 1000;

  timers[domain].timer = setInterval(function() {
    const elapsedTime = Math.floor((Date.now() - timers[domain].startTime) / 1000);
    console.log(`Elapsed time for ${domain}: ${elapsedTime} seconds`);

    if (Date.now() - timers[domain].startTime >= timeLimitMs) {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs.find(tab => new URL(tab.url).hostname.replace(/^www\./, '') === domain);
        if (tab) {
          chrome.tabs.update(tab.id, { url: 'about:blank' }); // Redirect to a blank page
          console.log(`Time limit reached for ${domain}. Redirecting...`);
        }
      });
      clearInterval(timers[domain].timer);
      delete timers[domain];
      chrome.storage.sync.remove(domain, function() {
        console.log(`Removed timer for ${domain} from storage`);
      });
    }
  }, 10000); // Log every 10 seconds

  console.log(`Timer set for ${domain} with a limit of ${timeLimit} minutes`);
}

chrome.runtime.onMessage.addListener(function(message) {
  if (message.action === 'startTimer') {
    startTimer(message.domain, message.timeLimit);
  } else if (message.action === 'clearAllTimers') {
    for (const domain in timers) {
      clearInterval(timers[domain]?.timer);
      delete timers[domain];
    }
    console.log('Cleared all timers');
  }
});

chrome.webNavigation.onCompleted.addListener(function(details) {
  const url = new URL(details.url);
  let domain = url.hostname.replace(/^www\./, '');

  chrome.storage.sync.get([domain], function(data) {
    if (data[domain]) {
      startTimer(domain, data[domain]);
    }
  });
}, { url: [{ urlMatches: 'https?://*/*' }] });

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    for (const key in changes) {
      if (changes[key].newValue === undefined) {
        clearInterval(timers[key]?.timer);
        delete timers[key];
        console.log(`Timer cleared for ${key}`);
      }
    }
  }
});
