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

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
}

class MarkerLine implements Displayable {
    points: { x: number; y: number }[] = [];

    constructor(x: number, y: number) {
        this.points.push({ x, y });
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(context: CanvasRenderingContext2D) {
        if (this.points.length > 1) {
            context.beginPath();
            context.moveTo(this.points[0].x, this.points[0].y);
            for (const { x, y } of this.points) {
                context.lineTo(x, y);
            }
            context.stroke();
        }
    }
}

const lines: Displayable[] = [];
const redoLines: Displayable[] = [];

let currentLine: MarkerLine | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    currentLine = new MarkerLine(cursor.x, cursor.y);
    lines.push(currentLine);
    redoLines.splice(0, redoLines.length);

    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
    if (cursor.active && currentLine) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        currentLine.drag(cursor.x, cursor.y);

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
        line.display(ctx!);
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
