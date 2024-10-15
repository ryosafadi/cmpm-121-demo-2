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

const lines: { x: number; y: number }[][] = [];
const redoLines: { x: number; y: number }[][] = [];

let currentLine: { x: number; y: number }[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    currentLine = [];
    lines.push(currentLine);
    redoLines.splice(0, redoLines.length);
    currentLine.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
    if (cursor.active) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        currentLine?.push({ x: cursor.x, y: cursor.y });

        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = null;

    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
    ctx?.fillRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
        if (line.length > 1) {
            ctx?.beginPath();
            const { x, y } = line[0];
            ctx?.moveTo(x, y);

            for (const { x, y } of line) {
                ctx?.lineTo(x, y);
            }

            ctx?.stroke();
        }
    }
});

const buttonContainer = document.createElement("div");
buttonContainer.className = "buttonContainer";
canvasContainer.append(buttonContainer);

const clearButton = document.createElement("button");
clearButton.innerHTML = "CLEAR";
buttonContainer.append(clearButton);

clearButton.addEventListener("click", () => {
    lines.splice(0, lines.length);
    canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "UNDO";
buttonContainer.append(undoButton);

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        redoLines.push(lines.pop()!);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "REDO";
buttonContainer.append(redoButton);

redoButton.addEventListener("click", () => {
    if (redoLines.length > 0) {
        lines.push(redoLines.pop()!);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});