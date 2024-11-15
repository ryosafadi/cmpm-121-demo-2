import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app: HTMLDivElement | null = document.querySelector("#app");
if (!app) throw new Error("App container not found");

document.title = APP_NAME;

const title = document.createElement("h1");
title.innerHTML = APP_NAME;
app.append(title);

const canvasContainer = document.createElement("div");
canvasContainer.className = "canvasContainer";
app.append(canvasContainer);

createButton("EXPORT", canvasContainer, () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;

    const exportCtx = exportCanvas.getContext("2d");

    if (exportCtx) {
        exportCtx.fillStyle = "white";
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        exportCtx.scale(4, 4);

        for (const line of lines) {
            line.display(exportCtx);
        }
    }

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
});

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvasContainer.append(canvas);

const ctx = canvas.getContext("2d");

if (!ctx) {
    throw new Error("Failed to get canvas 2D context");
}
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

function notify(name: string) {
    canvas.dispatchEvent(new Event(name));
}

let currentThickness: number = 2;
let currentColor: string = "black";
let currentRotation: number = 0;
let cursorCommand: CursorCommand | null = null;

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

class MarkerCommand implements Displayable {
    points: { x: number; y: number }[] = [];
    thickness: number;
    color: string;

    constructor(x: number, y: number, thickness: number, color: string) {
        this.points.push({ x, y });
        this.thickness = thickness;
        this.color = color;
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
            context.strokeStyle = this.color;
            context.stroke();
        }
    }
}

class StickerCommand implements Displayable {
    sticker: string;
    x: number;
    y: number;
    rotation: number;

    constructor(sticker: string, x: number, y: number, rotation: number) {
        this.sticker = sticker;
        this.x = x;
        this.y = y;
        this.rotation = rotation;

        const fontSize: number = 32;
        const context = document.createElement("canvas").getContext("2d")!;
        context.font = `${fontSize}px Arial`;
    }

    display(context: CanvasRenderingContext2D) {
        const fontSize: number = 32;
        context.font = `${fontSize}px Arial`;
        const textWidth = context.measureText(this.sticker).width;
        const textHeight = fontSize;

        context.save();
        context.translate(this.x, this.y);
        context.rotate(this.rotation);
        context.fillText(this.sticker, -textWidth / 2, textHeight / 2);
        context.restore();
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class CursorCommand {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    display(context: CanvasRenderingContext2D) {
        if (currentButton?.parentElement === markerButtons) {
            const radius = currentThickness;
            context.beginPath();
            context.arc(this.x, this.y, radius, 0, Math.PI * 2);
            context.fillStyle = "transparent";
            context.fill();
            context.strokeStyle = currentColor;
            context.lineWidth = 1;
            context.stroke();
        } else {
            const fontSize: number = 32;
            context.font = `${fontSize}px Arial`;
            const textWidth = context.measureText(
                currentButton!.innerHTML,
            ).width;
            const textHeight = fontSize;

            const rotationAngle = currentRotation;

            context.save();
            context.translate(this.x, this.y);
            context.rotate(rotationAngle);
            context.fillText(
                currentButton!.innerHTML,
                -textWidth / 2,
                textHeight / 2,
            );
            context.restore();
        }
    }
}

const lines: Displayable[] = [];
const redoLines: Displayable[] = [];

let currentLine: Displayable | null = null;
let currentButton: HTMLButtonElement | null = null;

const cursor = { active: false, x: 0, y: 0 };

const stickers = ["🐼", "🐸", "👓"];

canvas.addEventListener("drawing-changed", () => {
    if (ctx) ctx.fillStyle = "white";
    ctx?.fillRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
        line.display(ctx!);
    }
});

canvas.addEventListener("tool-moved", () => {
    if (ctx) ctx.fillStyle = "white";
    ctx?.fillRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
        line.display(ctx!);
    }

    cursorCommand?.display(ctx!);
    colorPicker.value = currentColor;
});

canvas.addEventListener("sticker-added", () => {
    createButton(
        stickers[0],
        stickerButtons,
        () => {
            currentRotation = getRandomRotation();
            notify("tool-moved");
        },
        true,
    );
});

canvas.addEventListener("mouseout", () => {
    cursorCommand = null;
    notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
    notify("tool-moved");
});

canvas.addEventListener("mousedown", (e) => {
    canvas.style.cursor = "default";
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    if (currentButton?.parentElement === markerButtons) {
        currentLine = new MarkerCommand(
            cursor.x,
            cursor.y,
            currentThickness,
            currentColor,
        );
        lines.push(currentLine!);
        redoLines.splice(0, redoLines.length);
    } else {
        currentLine = new StickerCommand(
            currentButton!.innerHTML,
            cursor.x,
            cursor.y,
            currentRotation,
        );
        lines.push(currentLine!);
        redoLines.splice(0, redoLines.length);
    }

    notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
    cursorCommand = new CursorCommand(e.offsetX, e.offsetY);
    notify("tool-moved");

    if (cursor.active && currentLine) {
        canvas.style.cursor = "default";
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;

        currentLine.drag(cursor.x, cursor.y);

        notify("drawing-changed");
    } else canvas.style.cursor = "none";
});

canvas.addEventListener("mouseup", () => {
    canvas.style.cursor = "none";
    cursor.active = false;
    currentLine = null;

    notify("tool-moved");
});

function createButton(
    label: string,
    container: HTMLDivElement,
    onClick: () => void,
    selectable: boolean = false,
    isSelected: boolean = false,
) {
    const button = document.createElement("button");
    button.innerHTML = label;
    if (isSelected) {
        button.classList.add("selectedTool");
        currentButton = button;
    }
    container.append(button);
    button.addEventListener("click", () => {
        onClick();
        if (selectable) setSelected(button);
    });
    return button;
}

function setSelected(selectedButton: HTMLButtonElement) {
    const allButtons = document.querySelectorAll("button");
    allButtons.forEach((button) => {
        button.classList.remove("selectedTool");
    });
    selectedButton.classList.add("selectedTool");
    currentButton = selectedButton;
}

const editButtons = document.createElement("div");
editButtons.className = "buttonContainer";
canvasContainer.append(editButtons);

createButton("CLEAR", editButtons, () => {
    lines.splice(0, lines.length);
    notify("drawing-changed");
});

createButton("UNDO", editButtons, () => {
    if (lines.length > 0) {
        redoLines.push(lines.pop()!);
        notify("drawing-changed");
    }
});

createButton("REDO", editButtons, () => {
    if (redoLines.length > 0) {
        lines.push(redoLines.pop()!);
        notify("drawing-changed");
    }
});

const markerButtons = document.createElement("div");
markerButtons.className = "buttonContainer";
canvasContainer.append(markerButtons);

createButton(
    "THIN",
    markerButtons,
    () => {
        currentThickness = 2;
        currentColor = getRandomHexColor();
        notify("tool-moved");
    },
    true,
    true,
);

createButton(
    "THICK",
    markerButtons,
    () => {
        currentThickness = 5;
        currentColor = getRandomHexColor();
        notify("tool-moved");
    },
    true,
);

const colorPicker = document.createElement("input");
colorPicker.type = "color";
colorPicker.id = "colorPicker";
colorPicker.value = currentColor;
markerButtons.appendChild(colorPicker);

colorPicker.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    currentColor = input.value;
});

const stickerButtons = document.createElement("div");
stickerButtons.className = "buttonContainer";
canvasContainer.append(stickerButtons);

for (const sticker of stickers) {
    createButton(
        sticker,
        stickerButtons,
        () => {
            currentRotation = getRandomRotation();
            notify("tool-moved");
        },
        true,
    );
}

createButton("CUSTOM", canvasContainer, () => {
    const text = prompt("Custom Sticker Text:", "");
    if (text) {
        stickers.unshift(text);
        notify("sticker-added");
    }
});

function getRandomHexColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function getRandomRotation() {
    return Math.random() * 2 * Math.PI;
}
