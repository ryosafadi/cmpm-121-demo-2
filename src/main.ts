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

function notify(name: string) {
    canvas.dispatchEvent(new Event(name));
}

let currentThickness: number = 1;
let cursorCommand: CursorCommand | null = null;

interface Displayable {
    display(context: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

class MarkerCommand implements Displayable {
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

class StickerCommand implements Displayable {
    sticker: string;
    x: number;
    y: number;
    centeredX: number;
    centeredY: number;

    constructor(sticker: string, x: number, y: number) {
        this.sticker = sticker;
        this.x = x;
        this.y = y;

        const fontSize: number = 32;
        const context = document.createElement('canvas').getContext('2d')!;
        context.font = `${fontSize}px Arial`;
        const textWidth = context.measureText(this.sticker).width;
        const textHeight = fontSize;

        this.centeredX = this.x - textWidth / 2;
        this.centeredY = this.y + textHeight / 2;
    }

    display(context: CanvasRenderingContext2D) {
        const fontSize: number = 32;
        context.font = `${fontSize}px Arial`;

        context.fillText(this.sticker, this.centeredX, this.centeredY);
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;

        const fontSize: number = 32;
        const textWidth = ctx!.measureText(this.sticker).width;
        const textHeight = fontSize;

        this.centeredX = this.x - textWidth / 2;
        this.centeredY = this.y + textHeight / 2;
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
        if (currentButton?.parentElement === markerButtons){
            const radius = currentThickness;
            context.beginPath();
            context.arc(this.x, this.y, radius, 0, Math.PI * 2);
            context.fillStyle = "transparent";
            context.fill();
            context.strokeStyle = "black";
            context.lineWidth = 1;
            context.stroke();
        }
        else {
            const fontSize: number = 32;
            context.font = `${fontSize}px Arial`;
            const textWidth = context.measureText(currentButton!.innerHTML).width;
            const textHeight = fontSize;

            const centeredX = this.x - textWidth / 2;
            const centeredY = this.y + textHeight / 2;
            
            context.fillText(currentButton!.innerHTML, centeredX, centeredY);
        }
    }
}

const lines: Displayable[] = [];
const redoLines: Displayable[] = [];

let currentLine: Displayable | null = null;
let currentButton: HTMLButtonElement | null = null;

const cursor = { active: false, x: 0, y: 0 };

const stickers = ["🐣", "🐈", "🦕"];

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
        currentLine = new MarkerCommand(cursor.x, cursor.y, currentThickness);
        lines.push(currentLine!);
        redoLines.splice(0, redoLines.length);
    }
    else {
        currentLine = new StickerCommand(currentButton!.innerHTML, cursor.x, cursor.y);
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
    }
    else canvas.style.cursor = "none";
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
    isSelected: boolean = false
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

createButton("THIN", markerButtons, () => {
    currentThickness = 1;
}, true, true);

createButton("THICK", markerButtons, () => {
    currentThickness = 5;
}, true);

const stickerButtons = document.createElement("div");
stickerButtons.className = "buttonContainer";
canvasContainer.append(stickerButtons);

for (const sticker of stickers) {
    createButton(sticker, stickerButtons, () => {
        notify("tool-moved");
    }, true);
}
