let currentDomain = '';

document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup loaded');

  // Get the current tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const url = new URL(tabs[0].url);
    currentDomain = url.hostname;
    if (currentDomain.startsWith('www.')) {
      currentDomain = currentDomain.substring(4);
    }
    document.getElementById('currentWebsite').textContent = 'Current website: ' + currentDomain;
    console.log('Current website:', currentDomain);
  });

  // Load existing timers
  loadTimers();
  // Load time spent data
  loadTimeSpent();
});

document.getElementById('limitForm').addEventListener('submit', function(event) {
  event.preventDefault();
  const timeLimit = parseInt(document.getElementById('timeLimit').value, 10);
  console.log(`Setting time limit: ${timeLimit} minutes for ${currentDomain}`);

  if (currentDomain && timeLimit > 0) {
    chrome.storage.sync.set({ [currentDomain]: timeLimit }, function() {
      document.getElementById('status').textContent = 'Limit set for ' + currentDomain;
      document.getElementById('status').style.color = 'green';
      console.log(`Limit set for ${currentDomain}: ${timeLimit} minutes`);
      chrome.runtime.sendMessage({ action: 'startTimer', domain: currentDomain, timeLimit: timeLimit });
      loadTimers(); // Refresh the list of timers
    });
  } else {
    document.getElementById('status').textContent = 'Please enter a valid time limit.';
    document.getElementById('status').style.color = 'red';
    console.log('Invalid input for time limit');
  }
});

document.getElementById('clearTimersButton').addEventListener('click', function() {
  chrome.storage.sync.clear(function() {
    document.getElementById('status').textContent = 'All timers cleared.';
    document.getElementById('status').style.color = 'green';
    console.log('All timers cleared');
    chrome.runtime.sendMessage({ action: 'clearAllTimers' });
    loadTimers(); // Refresh the list of timers
  });
});

function loadTimers() {
  chrome.storage.sync.get(null, function(items) {
    const timerList = document.getElementById('timerList');
    timerList.innerHTML = ''; // Clear the existing list
    console.log('Loading timers');

    for (const [website, timeLimit] of Object.entries(items)) {
      if (website !== 'timeSpent') {
        const listItem = document.createElement('li');
        listItem.textContent = `${website}: ${timeLimit} minutes`;
        timerList.appendChild(listItem);
        console.log(`Loaded timer: ${website} - ${timeLimit} minutes`);
      }
    }
  });
}

function loadTimeSpent() {
  chrome.storage.sync.get('timeSpent', function(data) {
    const timeSpentList = document.getElementById('timeSpentList');
    timeSpentList.innerHTML = ''; // Clear the existing list

    if (data.timeSpent) {
      for (const [domain, ms] of Object.entries(data.timeSpent)) {
        const listItem = document.createElement('li');
        listItem.textContent = `${domain}: ${Math.round(ms / 1000)} seconds`;
        timeSpentList.appendChild(listItem);
      }
    }
  });
}
