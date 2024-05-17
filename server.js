const express = require("express");
const path = require("path");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/home.html"));
});

app.get("/clubs", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/club.html"));
});

app.get("/events", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/event.html"));
});

app.get("/signInPage", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/signInPage.html"));
});

app.get("/registerPage", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/registerPage.html"));
});

app.listen(HTTP_PORT, () => {
  console.log(`server listening on: ${HTTP_PORT}`);
});
