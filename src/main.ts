import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const title = document.createElement("h1");
title.innerHTML = APP_NAME;
app.append(title);

const canvasContainer = document.createElement("div");
canvasContainer.className = "canvasContainer";
app.append(canvasContainer);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvasContainer.append(canvas);

const ctx = canvas.getContext("2d");

if (ctx) ctx.fillStyle = "white";
ctx?.fillRect(0, 0, canvas.width, canvas.height);

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        ctx?.beginPath();
        ctx?.moveTo(cursor.x, cursor.y);
        ctx?.lineTo(e.offsetX, e.offsetY);
        ctx?.stroke();
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
});

canvas.addEventListener("mouseup", (e) => {
    cursor.active = false;
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "CLEAR";
canvasContainer.append(clearButton);

clearButton.addEventListener("click", () => {
    ctx?.fillRect(0, 0, canvas.width, canvas.height);
});