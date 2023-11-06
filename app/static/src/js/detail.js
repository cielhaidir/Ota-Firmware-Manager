function openNodeConfig(nodeName, mac) {
    const modal = document.getElementById(nodeName);
    const textarea = modal.querySelector('textarea');
    const firmwareSelect = document.getElementById(`firmwareSelect_${nodeName}`);
    

    // Use AJAX to fetch the configuration content
    fetch(`../source/${nodeName}.json`)
        .then(response => response.text())
        .then(data => {
            data = data.replace(/\r\n/g, '\n');
            textarea.value = data;
        })
        .catch(error => {
            console.error(error);
        });

    fetch(`/get_bin_files/${mac}`)
        .then(response => response.json())
        .then(data => {
            const optionsToClear = firmwareSelect.querySelectorAll('option:not(:first-child)');
            optionsToClear.forEach(option => option.remove());

            const latestVersionSpan = document.getElementById(`latestVersion_${nodeName}`);
            const versionNumbers = data.map(binFile => {
                const match = binFile.match(/(\d+)/);
                return match ? parseInt(match[0]) : 0;
            });

            const latestVersion = Math.max(...versionNumbers);
            latestVersionSpan.textContent = latestVersion;

            data.forEach(binFile => {
                const option = document.createElement('option');
                option.value = binFile;
                option.textContent = binFile;
                firmwareSelect.appendChild(option);
            });

            // Show the <select> element
            firmwareSelect.style.display = 'block';
        })
        .catch(error => {
            console.error(error);
        });

    fetch(`/get_change_log/${nodeName}`)
        .then(response => response.text())
        .then(logContent => {
            const changeLogDisplay = document.getElementById(`changeLogDisplay_${nodeName}`);
            // Set the change log content in the <textarea>
            changeLogDisplay.value = logContent;
            changeLogDisplay.style.display = 'block';
        })
        .catch(error => {
            console.error(error);
        });

    modal.showModal();

    const fileinput = document.getElementById(`fileInput_${nodeName}`);
    const selectedFileName = document.getElementById(`selectedFileName_${nodeName}`);

    fileinput.addEventListener('change', function () {
        if (fileinput.files.length > 0) {
            selectedFileName.textContent = fileinput.files[0].name;
        } else {
            selectedFileName.textContent = '';
        }
    });
}

function uploadChangeLog(nodeName) {
    const changeLogInput = document.getElementById('changeLogInput');
    const version = document.getElementById('versionInput');
    // Fetch the change log and upload it
    fetch(`/upload_change_log/${nodeName}`, {
        method: 'POST',
        body: new FormData(document.querySelector('form')), // 
        headers: {
            'X-CSRFToken': getCSRFToken(), // Add CSRF token if required.
        },
    })
        .then(response => {
            if (response.ok) {
                // Log uploaded successfully
                changeLogInput.value = '';
                version.value = '';
            } else {
                // Handle upload error
                console.error('Upload error');
            }
        })
        .catch(error => {
            console.error(error);
        });
}

function showAlert(message) {
    const alertBox = document.getElementById("custom-alert");
    const alertMessage = alertBox.querySelector("span");
    alertMessage.textContent = message;
    alertBox.style.display = "block";
    setTimeout(function () {
      alertBox.style.display = "none";
    }, 3000); // Hide the alert after 3 seconds (adjust the duration as needed)
  }


function updateLatest(nodeName) {

    const ip_server = self.location.host;
    const url = `http://${ip_server}/update/${nodeName}`;

    // Make an HTTP request for each selected node
    fetch(url, {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          showAlert(`Successfully sent Latest Update for ${nodeName}`);
        } else {
          showAlert(`Failed to send Latest Update for ${nodeName}`);
        }
      })
      .catch((error) => {
        showAlert(`Error sending Latest Update for ${nodeName}: ${error}`);
      });

}

function CustomUpdate(nodeName, version) {

    const ip_server = self.location.host;
    const url = `http://${ip_server}/updateCustom/${nodeName}/${version}`;

    // Make an HTTP request for each selected node
    fetch(url, {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          showAlert(`Successfully sent Custom Update for ${nodeName}`);
        } else {
          showAlert(`Failed to send Custom Update for ${nodeName}`);
        }
      })
      .catch((error) => {
        showAlert(`Error sending Custom Update for ${nodeName}: ${error}`);
      });

}

const updateButtons = document.querySelectorAll('.update-button');
updateButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const nodeName = button.getAttribute('data-node-name');
    updateLatest(nodeName);
  });
});

const installButtons = document.querySelectorAll('.install-button');
installButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const nodeName = button.getAttribute('data-node-name');
    const selectId = `firmwareSelect_${nodeName}`;
    const selectedOption = document.getElementById(selectId).value;
    if (selectedOption) {
        CustomUpdate(nodeName, selectedOption);
      } else {
        console.log('Please select a firmware version.');
      }
  });
});

const detailButtons = document.querySelectorAll('.detail-button');
detailButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const nodeName = button.getAttribute('data-node-name');
    const macAddr = button.getAttribute('data-mac-addr');
    openNodeConfig(nodeName, macAddr)
  });
});

