import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

const title = document.createElement("h1");
title.innerHTML = APP_NAME;
app.append(title);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);
const ctx = canvas.getContext("2d");

if (ctx) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
else console.error("No 2D context found");
