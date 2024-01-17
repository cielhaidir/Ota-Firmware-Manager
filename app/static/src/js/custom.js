document.addEventListener("DOMContentLoaded", function () {
  const checkboxes = document.querySelectorAll(".checkbox");

  const checkAll = document.getElementById('checkAll');

  checkAll.addEventListener('change', function() {
    checkboxes.forEach(checkbox => {
      checkbox.checked = checkAll.checked;
    });
  });
  

  checkboxes.forEach(individualCheckbox => {
    individualCheckbox.addEventListener('change', function() {
      if (this !== checkAll) {
        const checkboxesArray = Array.from(checkboxes);
        checkAll.checked = checkboxesArray.every(checkbox => checkbox.checked);
      }
    });
  });
  
  function showAlert(message) {
    const alertBox = document.getElementById("custom-alert");
    const alertMessage = alertBox.querySelector("span");
    alertMessage.textContent = message;
    alertBox.style.display = "block";
    setTimeout(function () {
      alertBox.style.display = "none";
    }, 3000); // Hide the alert after 3 seconds (adjust the duration as needed)
  }

  function handleAction(button, action) {
    button.addEventListener("click", function (event) {
      event.preventDefault();


      // Collect selected node names
      const selectedNodeNames = Array.from(checkboxes)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.getAttribute("data-node-name"));
        
      const displayName = selectedNodeNames.length > 1 ? "Selected Node" : selectedNodeNames[0];
      // Iterate through selected node names and make requests
      selectedNodeNames.forEach(function (nodeName) {
        const protocol = window.location.protocol;
        const ip_server = window.location.host;
        const url = `${protocol}//${ip_server}/${action}/${nodeName}`;
        // console.log(url);

        // Make an HTTP request for each selected node
        fetch(url, {
          method: "GET",
        })
          .then((response) => {
            // console.log(response);
            if (response.ok) {
              showAlert(`Successfully sent ${action} request for ${displayName}`);
              setTimeout(() => {
                location.reload();
              }, 2000);
            } else {
              showAlert(`Failed to send ${action} request for ${displayName}`);
            }
          })
          .catch((error) => {
            showAlert(`Error sending ${action} request for ${displayName}: ${error}`);
          });
      });
    });
  }

  const restartButton = document.getElementById("restart-button");
  handleAction(restartButton, "restart");

  const unlockButton = document.getElementById("unlock-button");
  handleAction(unlockButton, "unlock");


})



