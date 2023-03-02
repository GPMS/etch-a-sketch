const fakeCanvas = document.querySelector("#fake-canvas");
const resetButton = document.querySelector("#reset-btn");
const randomColor = document.querySelector("#random");
const darkenColor = document.querySelector("#darken");

let canvasDimension = 16;

/**
 * Generates divs to fill in the canvas based on the
 * configured dimensions
 */
function generateCells() {
  fakeCanvas.textContent = "";
  const cellCount = canvasDimension * canvasDimension;
  for (let index = 0; index < cellCount; index++) {
    let cell = document.createElement("div");
    cell.classList.add("cell");
    const x = Math.floor(index % canvasDimension);
    const y = Math.floor(index / canvasDimension);
    cell.setAttribute("data-x", x);
    cell.setAttribute("data-y", y);
    fakeCanvas.append(cell);
  }
}

/**
 * Prompts the user for a new dimension and changes
 * the canvas to match it
 */
function resetCanvas() {
  // Don't stop asking for a new dimension until we get a valid value
  let newDimension;
  while (!newDimension || newDimension > 100 || newDimension < 0) {
    newDimension = Number(
      prompt("What canvas dimension do you want (up to 100)?", 16)
    );
  }

  // Set dimension and regenerate cells
  canvasDimension = newDimension;
  fakeCanvas.style.setProperty("--dimension", newDimension);
  generateCells();

  // Resume painting
  startPainting();
}

/**
 * Generates a random RGB color
 * @returns {object} A RGB color
 */
function getRandomColor() {
  return {
    r: Math.floor(Math.random() * 255),
    g: Math.floor(Math.random() * 255),
    b: Math.floor(Math.random() * 255),
  };
}

/**
 * Clamps the given value between the min and max
 * @param {number} value The number to clamp
 * @param {number} min Minimum allowed value
 * @param {number} max Maximum allowed value
 * @returns {number} A number inside the interval [min;max]
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Changes the given color brightness by percent%
 * @param {string} color The starting color
 * @param {number} percent How much to increase the brightness by
 * @returns {object} A RGB color
 */
function changeColorBrightness(color, percent) {
  const redAmount = color.r / 255;
  const greenAmount = color.g / 255;
  const blueAmount = color.b / 255;
  percent = percent / 100;
  return {
    r: Math.floor(clamp((redAmount + percent) * 255, 0, 255)),
    g: Math.floor(clamp((greenAmount + percent) * 255, 0, 255)),
    b: Math.floor(clamp((blueAmount + percent) * 255, 0, 255)),
  };
}

/**
 * Gets the rgb values out of a CSS color
 * @param {string} cssColor a color in the format "rgb('r','g','b');"
 * @returns {object} A RGB color
 */
function rgbCSSColorToRGB(cssColor) {
  if (!cssColor) {
    return undefined;
  }
  let colorValues = [...cssColor.matchAll(/\d+/g)];
  return {
    r: Number(colorValues[0][0]),
    g: Number(colorValues[1][0]),
    b: Number(colorValues[2][0]),
  };
}

/**
 * Change the background color of the given cell's position
 * @param {number} x cell's x position
 * @param {number} y cell's y position
 */
function changeCellColor(x, y) {
  const index = y * canvasDimension + Math.floor(x % canvasDimension);
  let cell = fakeCanvas.childNodes[index];
  let color = cell.style.backgroundColor;
  if (!color) {
    if (randomColor.checked) {
      color = getRandomColor();
    } else {
      color = {
        r: 240,
        g: 240,
        b: 240,
      };
    }
  } else if (darkenColor.checked) {
    // Decrease color brightness by 10%
    color = changeColorBrightness(rgbCSSColorToRGB(color), -10);
  }
  cell.style.backgroundColor = `rgb(${color.r},${color.g},${color.b})`;
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

/**
 * Add event listeners to enable painting
 */
function startPainting() {
  let prevPos = undefined;

  fakeCanvas.childNodes.forEach((cell) => {
    cell.addEventListener("mouseleave", (e) => {
      prevPos = {
        x: Number(e.target.dataset.x),
        y: Number(e.target.dataset.y),
      };
    });

    cell.addEventListener("mouseenter", (e) => {
      const thisX = Number(e.target.dataset.x);
      const thisY = Number(e.target.dataset.y);
      if (!prevPos) {
        changeCellColor(thisX, thisY);
      } else {
        plotLine(prevPos.x, prevPos.y, thisX, thisY);
      }
    });
  });

  // Invalidate the previous position if the mouse leaves the canvas,
  // otherwise the line will jump once it reenters.
  fakeCanvas.addEventListener("mouseleave", () => {
    prevPos = undefined;
  });
}

window.onload = () => {
  generateCells();

  resetButton.addEventListener("click", (e) => {
    resetCanvas();
  });

  startPainting();
};
