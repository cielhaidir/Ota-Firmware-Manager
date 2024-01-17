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
            console.log(data)
              const optionsToClear = firmwareSelect.querySelectorAll('option:not(:first-child)');
              optionsToClear.forEach(option => option.remove());

              const latestVersionSpan = document.getElementById(`latestVersion_${nodeName}`);
              const versionNumbers = data.map(binFile => {
                  const match = binFile.match(/(\d+)/);
                  return match ? parseInt(match[0]) : 0;
              });

                const latestVersion = Math.max(...versionNumbers);
                const numericVersions = versionNumbers.filter(value => !isNaN(value));
                
                if (numericVersions.length > 0) {
                  latestVersionSpan.textContent = latestVersion;
                }
                else {
                  latestVersionSpan.textContent = "There are no Firmware in Server"
                }


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

function updateChangelog(id, nodeName) {

    const ip_server = self.location.host;
    const url = `http://${ip_server}/updateChangelog/${id}`;

    // Make an HTTP request for each selected node
    fetch(url, {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          showAlert(`Successfully sent Rename Command for ${nodeName}`);
        } else {
          showAlert(`Failed to send Rename Command for ${nodeName}`);
        }
      })
      .catch((error) => {
        showAlert(`Error sending Rename Command for ${nodeName}: ${error}`);
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


const renameButtons = document.querySelectorAll('.updatecl-button');
renameButtons.forEach(function (button) {
  button.addEventListener('click', function () {
      const entryId = button.getAttribute('data-entry-id');

      // Toggle visibility of display text and input field for version
      const versionDisplayText = document.getElementById(`version_${entryId}`).querySelector('.display-text');
      const versionInput = document.getElementById(`version_${entryId}`).querySelector('input');
      versionDisplayText.classList.toggle('hidden');
      versionInput.classList.toggle('hidden');

      // Toggle visibility of display text and input field for change log
      const changeLogDisplayText = document.getElementById(`change_log_${entryId}`).querySelector('.display-text');
      const changeLogInput = document.getElementById(`change_log_${entryId}`).querySelector('input');
      changeLogDisplayText.classList.toggle('hidden');
      changeLogInput.classList.toggle('hidden');

      // Toggle visibility of Update and Save buttons
      button.classList.toggle('hidden');
      const saveButton = document.querySelector(`.save-button[data-entry-id='${entryId}']`);
      saveButton.classList.toggle('hidden');
      
  });
});

const saveButton = document.querySelectorAll('.save-button');
saveButton.forEach(function (button) {
  button.addEventListener('click', function () {
      const entryId = button.getAttribute('data-entry-id');

      // Get the updated values from the input fields
      const versionInput = document.getElementById(`version_${entryId}`).querySelector('input');
      const changeLogInput = document.getElementById(`change_log_${entryId}`).querySelector('input');
      const updatedVersion = versionInput.value;
      const updatedChangeLog = changeLogInput.value;


      fetch(`/updateChangelog/${entryId}`, {
          method: 'POST',
          body: JSON.stringify({
              version: updatedVersion,
              changeLog: updatedChangeLog,
          }),
          headers: {
              'Content-Type': 'application/json',
          },
      })
          .then(response => {
              if (response.ok) {
                  // Log updated successfully
                  console.log('Update successful');
                  
                  // Toggle visibility of display text and input field for version
                  versionInput.classList.toggle('hidden');
                  const versionDisplayText = document.getElementById(`version_${entryId}`).querySelector('.display-text');
                  versionDisplayText.classList.toggle('hidden');
                  versionDisplayText.textContent = updatedVersion;

                  // Toggle visibility of display text and input field for change log
                  changeLogInput.classList.toggle('hidden');
                  const changeLogDisplayText = document.getElementById(`change_log_${entryId}`).querySelector('.display-text');
                  changeLogDisplayText.classList.toggle('hidden');
                  changeLogDisplayText.textContent = updatedChangeLog;

                  // Toggle visibility of Update and Save buttons
                  button.classList.toggle('hidden');
                  const updateButton = document.querySelector(`.updatecl-button[data-entry-id='${entryId}']`);
                  updateButton.classList.toggle('hidden');
              } else {
                  // Handle update error
                  console.error('Update error');
              }
          })
          .catch(error => {
              console.error(error);
          });
  });
});

const DeleteButtons = document.querySelectorAll('.delete-button');
DeleteButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const nodeName = button.getAttribute('data-node-name');
    const idVersion = button.getAttribute('data-entry-id');
    console.log('Deleting entry with ID:', idVersion);

      fetch(`/deletechangelog/${idVersion}`, {
        method: "GET",
      })
        .then((response) => {
          if (response.ok) {
            location.reload();
          } else {
            showAlert(`Failed to Delete Changelog ${nodeName}`);
          }
        })
        .catch((error) => {
          showAlert(`Error sending Custom Update for ${nodeName}: ${error}`);
        });



    
  });
});

function createCheckbox(labelText, id, isChecked) {
  const span = document.createElement('span');
  span.textContent = labelText;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = id;
  checkbox.className = 'toggle mt-5';
  checkbox.dataset.nodeName = node_name;
  checkbox.checked = isChecked === 'ON';

  span.appendChild(checkbox);

  return span;
}

const detailButtons = document.querySelectorAll('.detail-button');
detailButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    const nodeName = button.getAttribute('data-node-name');
    const macAddr = button.getAttribute('data-mac-addr');
    openNodeConfig(nodeName, macAddr)
  });
});

const checkboxes = document.querySelectorAll('.toggle');


  const node_name = checkbox.dataset.nodeName;
  const switchDiv = document.getElementById('switch');

  fetch(`/get_config/${node_name}`)
      .then(response => response.json())
      .then(data => {
          if (data.status === 'success' && data.config && data.config.main) {
              // const ledStatus = data.config.main.led;
              // checkbox.checked = ledStatus === 'ON';
              for (const property in data.config.main) {
                if (data.config.main.hasOwnProperty(property)) {
                    const checkbox = createCheckbox(property, property.toLowerCase(), data.config.main[property]);
                    switchDiv.appendChild(checkbox);
                }
            }
          } else {
              console.error('Invalid response format or missing data:', data);
          }
      })
      .catch(error => {
          console.error('Error fetching configuration:', error);
      });


checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        const node_name = this.dataset.nodeName;
        const ledStatus = this.checked ? 'ON' : 'OFF';

        fetch('/update_config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                config_name: node_name,
                led_status: ledStatus,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Handle the response if needed
        })
        .catch(error => {
            console.error(error);
        });
    });
});
