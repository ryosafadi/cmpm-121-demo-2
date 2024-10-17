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

let currentThickness = 1;

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
}

class MarkerLine implements Displayable {
    points: { x: number; y: number }[] = [];
    thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.points.push({ x, y });
        this.thickness = thickness;
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
            context.lineWidth = this.thickness;
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

    currentLine = new MarkerLine(cursor.x, cursor.y, currentThickness);
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

const editButtons = document.createElement("div");
editButtons.className = "buttonContainer";
canvasContainer.append(editButtons);

const clearButton = document.createElement("button");
clearButton.innerHTML = "CLEAR";
editButtons.append(clearButton);

clearButton.addEventListener("click", () => {
    lines.splice(0, lines.length);
    canvas.dispatchEvent(new Event("drawing-changed"));
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "UNDO";
editButtons.append(undoButton);

undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        redoLines.push(lines.pop()!);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "REDO";
editButtons.append(redoButton);

redoButton.addEventListener("click", () => {
    if (redoLines.length > 0) {
        lines.push(redoLines.pop()!);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

const markerButtons = document.createElement("div");
markerButtons.className = "buttonContainer";
canvasContainer.append(markerButtons);

const thinButton = document.createElement("button");
thinButton.innerHTML = "THIN";
thinButton.classList.add("selectedTool");
markerButtons.append(thinButton);

thinButton.addEventListener("click", () => {
    currentThickness = 1;
    thinButton.classList.add("selectedTool");
    thickButton.classList.remove("selectedTool");
});

const thickButton = document.createElement("button");
thickButton.innerHTML = "THICK";
markerButtons.append(thickButton);

thickButton.addEventListener("click", () => {
    currentThickness = 5;
    thickButton.classList.add("selectedTool");
    thinButton.classList.remove("selectedTool");
});
