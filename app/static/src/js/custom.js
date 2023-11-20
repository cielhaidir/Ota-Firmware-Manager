document.addEventListener("DOMContentLoaded", function () {
  const checkboxes = document.querySelectorAll(".checkbox");

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

      // Iterate through selected node names and make requests
      selectedNodeNames.forEach(function (nodeName) {
        const ip_server = self.location.host;
        const url = `http://${ip_server}/${action}/${nodeName}`;

        // Make an HTTP request for each selected node
        fetch(url, {
          method: "GET",
        })
          .then((response) => {
            if (response.ok) {
              showAlert(`Successfully sent ${action} request for ${nodeName}`);
            } else {
              showAlert(`Failed to send ${action} request for ${nodeName}`);
            }
          })
          .catch((error) => {
            showAlert(`Error sending ${action} request for ${nodeName}: ${error}`);
          });
      });
    });
  }

  const restartButton = document.getElementById("restart-button");
  handleAction(restartButton, "restart");

  const unlockButton = document.getElementById("unlock-button");
  handleAction(unlockButton, "unlock");


})



