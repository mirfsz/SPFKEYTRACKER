function changeClass(elem) {
	console.log(elem.className)
	if (elem.className.includes("default_true")) {
      document.getElementById(elem.id).classList.toggle("toggle_false");
      if (elem.className.includes("toggle_false")) {
          updateStatus(elem.getAttribute("coy"), elem.value, "False")
      } else {
          updateStatus(elem.getAttribute("coy"), elem.value, "True")
    }
  } else if (elem.className.includes("default_false")) {
  	  document.getElementById(elem.id).classList.toggle("toggle_true");
        if (elem.className.includes("toggle_true")) {
          updateStatus(elem.getAttribute("coy"), elem.value, "True")
      } else {
          updateStatus(elem.getAttribute("coy"), elem.value, "False")
    }
  }
}

function updateStatus(coy, bunk, status) {
  $.ajax({
        url: '/updateStatus',
        data: {coy: coy, bunk: bunk, status: status},
        type: 'POST',
        success: function (response) {
          console.log(response);
        },
        error: function (error) {
          console.log('failed');
          console.log(error);
        }
      });
}

function editTrueValue(elem) {
    var coy = elem.getAttribute("coy")
    var boxId = elem.value
    var newTrueValue = prompt("Please enter new true key val for " + coy + " KEYHOLE " + boxId);
  $.ajax({
        url: '/editTrueValue',
        data: {coy: coy, boxId: boxId, newTrueValue: newTrueValue},
        type: 'POST',
        success: function (response) {
          console.log(response);
        },
        error: function (error) {
          console.log('failed');
          console.log(error);
        }
      });
}

function toggleMissing(elem) {
	console.log(elem.className)
	if (elem.className.includes("default_missing")) {
      document.getElementById(elem.id).classList.toggle("toggle_true");
      if (elem.className.includes("toggle_true")) {
          updateStatus(elem.getAttribute("coy"), elem.value, "True")
      } else {
          updateStatus(elem.getAttribute("coy"), elem.value, "Missing")
    }
  } else if (elem.className.includes("default_true")) {
  	  document.getElementById(elem.id).classList.toggle("toggle_missing");
        if (elem.className.includes("toggle_missing")) {
          updateStatus(elem.getAttribute("coy"), elem.value, "Missing")
      } else {
          updateStatus(elem.getAttribute("coy"), elem.value, "True")
    }
  } else if (elem.className.includes("default_false")) {
  	  document.getElementById(elem.id).classList.toggle("toggle_missing");
        if (elem.className.includes("toggle_missing")) {
          updateStatus(elem.getAttribute("coy"), elem.value, "Missing")
      } else {
          updateStatus(elem.getAttribute("coy"), elem.value, "False")
    }
  }
}


function generateReport() {
  $.ajax({
        url: '/genReport',
        type: 'GET',
        success: function (response) {
          console.log(response);
          setTimeout(async () => await
              navigator.clipboard.writeText(response).then(function() {
                  console.log('Async: Copying to clipboard was successful!');
                  window.alert("Report has been copied!");
                }, function(err) {
                  console.error('Async: Could not copy text: ', err);
                  window.alert("Something went wrong with copying the report. Try generating it at /genReport", err);

              }));
        },
        error: function (error) {
          console.log('failed');
          console.log(error);
        }
      });
}


// $(function () {
//   $('button').click(function () {
//
//     });
//   });
// });