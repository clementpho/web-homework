document.addEventListener("DOMContentLoaded", () => {
  // Initial clean up. DO NOT REMOVE.
  initialCleanup();
  updateCounts();

  document.getElementById("btn-remove-line").addEventListener("click", () => {
  const grid = document.getElementById("grid");
  if (grid.childNodes.length > 0) 
    for (i = 0; i < 10; i++){
    grid.removeChild(grid.lastChild);
    updateCounts();
  }
});

  document.getElementById("btn-add-line").addEventListener("click", () => {
    const grid = document.getElementById("grid");
  
    for (i = 0; i < 10; i++) {
      const newLine = document.createElement("div");
      grid.appendChild(newLine);

      newLine.addEventListener("click", (event) => {
        newLine.classList.add("clicked");
        if (newLine.classList.contains("hovered")) {
          newLine.classList.remove("hovered");
        }
        newLine.style.backgroundColor = "orange";
        updateCounts();
      });

      newLine.addEventListener("mouseover", (event) => {
        if (!newLine.classList.contains("clicked")) {
          newLine.classList.add("hovered");
          newLine.style.backgroundColor = "blue";
          updateCounts();
        }
      });

      updateCounts();
    }
  });

  const squares = document.querySelectorAll("#grid div");

  squares.forEach((square) => {
    square.addEventListener("click", (event) => {
      square.classList.add("clicked");
      if (square.classList.contains("hovered")) {
        square.classList.remove("hovered");
      }
      square.style.backgroundColor = "orange";
      updateCounts();
    });

    square.addEventListener("mouseover", (event) => {
      if (!square.classList.contains("clicked")) {
        square.classList.add("hovered");
        square.style.backgroundColor = "blue";
        updateCounts();
      }
    });
  });
});

/**
 * Cleans up the document so that the exercise is easier.
 *
 * There are some text and comment nodes that are in the initial DOM, it's nice
 * to clean them up beforehand.
 */
function initialCleanup() {
  const nodesToRemove = [];
  document.getElementById("grid").childNodes.forEach((node, key) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      nodesToRemove.push(node);
    }
  });
  for (const node of nodesToRemove) {
    node.remove();
  }
}

function updateCounts() {
  const countClickedValue = document.querySelectorAll("#grid div.clicked").length;
  const countBlueValue = document.querySelectorAll("#grid div.hovered").length;
  const countTotalValue = document.querySelectorAll("#grid div").length;
  const countOriginalValue = countTotalValue - countClickedValue - countBlueValue;

  const countOriginal = document.getElementById("count-original");
  const countClicked = document.getElementById("count-clicked");
  const countBlue = document.getElementById("count-blue");
  const countTotal = document.getElementById("count-total");

  countOriginal.innerText = `Original squares: ${countOriginalValue}`;
  countClicked.innerText = `Clicked squares: ${countClickedValue}`;
  countBlue.innerText = `Blue squares: ${countBlueValue}`;
  countTotal.innerText = `Total squares: ${countTotalValue}`;
}
