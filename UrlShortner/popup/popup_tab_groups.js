document.addEventListener('DOMContentLoaded', function() {
  const tabGroupSelect = document.getElementById('tabGroupSelect');

  function getSavedTabGroupId() {
        return localStorage.getItem('selectedTabGroupId');
  }

  function saveTabGroupId(groupId) {
        localStorage.setItem('selectedTabGroupId', groupId);
  }

  function populateTabGroups() {
    chrome.tabGroups.query({}, function(groups) {
      const savedGroupId = getSavedTabGroupId();
      let savedGroupExists = false;

      tabGroupSelect.innerHTML = '';

      const defaultOption = document.createElement('option');
      defaultOption.value = "";
      defaultOption.textContent = "Select Tab Group";
      tabGroupSelect.appendChild(defaultOption);

      groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.title || `Group ${group.id}`;
        tabGroupSelect.appendChild(option);

        if (group.id.toString() === savedGroupId) {
          savedGroupExists = true;
        }
      });

      if (savedGroupExists) {
        tabGroupSelect.value = savedGroupId;
      } else {
        tabGroupSelect.value = "";
        localStorage.removeItem('selectedTabGroupId');
      }
    });
  }

  populateTabGroups();

  tabGroupSelect.addEventListener('change', function() {
    const selectedGroupId = this.value;
    saveTabGroupId(selectedGroupId);
  });
});