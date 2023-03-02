const fakeCanvas = document.querySelector("#fake-canvas");
const resetButton = document.querySelector("#reset-btn");

let canvasDimension = 16;

/**
 * The cell coordinates the mouse was previously at
 * @type {object}
 */
let prevPos = undefined;

/**
 * Change the background color of the given cell's position
 * @param {number} x cell's x position
 * @param {number} y cell's y position
 */
function changeCellColor(x, y) {
  const index = y * canvasDimension + Math.floor(x % canvasDimension);
  let cell = fakeCanvas.childNodes[index];
  cell.style.backgroundColor = "black";
}

/**
 * Bresenham's line algorithm.
 *
 * Source: https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
 *
 * If the mouse moves too fast we will only get some of the cells it
 * passed through resulting in a broken line.
 *
 * So we need to fill the rest based on the previous position and
 * the current one.
 *
 * @param {number} x0 previous x
 * @param {number} y0 previous y
 * @param {number} x1 current x
 * @param {number} y1 current y
 */
function plotLine(x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    changeCellColor(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    let e2 = 2 * error;
    if (e2 >= dy) {
      if (x0 === x1) break;
      error = error + dy;
      x0 = x0 + sx;
    }
    if (e2 <= dx) {
      if (y0 === y1) break;
      error = error + dx;
      y0 = y0 + sy;
    }
  }
}

function mouseLeave(e) {
  prevPos = {
    x: Number(e.target.dataset.x),
    y: Number(e.target.dataset.y),
  };
}

function mouseEnter(e) {
  const thisX = Number(e.target.dataset.x);
  const thisY = Number(e.target.dataset.y);
  if (!prevPos) {
    changeCellColor(thisX, thisY);
  } else {
    plotLine(prevPos.x, prevPos.y, thisX, thisY);
  }
}

/**
 * Generates divs to fill in the canvas based on the
 * configured dimensions
 */
function generateCanvasCells() {
  for (let index = 0; index < canvasDimension * canvasDimension; index++) {
    let cell = document.createElement("div");
    cell.classList.add("cell");
    const x = Math.floor(index % canvasDimension);
    const y = Math.floor(index / canvasDimension);
    cell.setAttribute("data-x", x);
    cell.setAttribute("data-y", y);
    cell.addEventListener("mouseenter", mouseEnter, true);
    cell.addEventListener("mouseleave", mouseLeave, true);
    fakeCanvas.append(cell);
  }
}

/**
 * Prompts the user for a new dimension and changes
 * the canvas to match it
 */
function resetCanvas() {
  let newDimension = undefined;
  while (!newDimension || newDimension > 100 || newDimension < 0) {
    newDimension = Number(
      prompt("What canvas dimension do you want (up to 100)?")
    );
  }
  canvasDimension = newDimension;
  fakeCanvas.style.setProperty("--dimension", newDimension);
  fakeCanvas.textContent = "";
  generateCanvasCells();
}

window.onload = () => {
  generateCanvasCells();

  // Invalidate the previous position if the mouse leaves the canvas,
  // otherwise the line will jump once it reenters.
  fakeCanvas.addEventListener("mouseleave", () => {
    prevPos = undefined;
  });

  resetButton.addEventListener("click", (e) => {
    resetCanvas();
  });
};
