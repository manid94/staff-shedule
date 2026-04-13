const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = __dirname + "/staff.json";

const readData = () => JSON.parse(fs.readFileSync(FILE));
const writeData = (data) =>
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

// GET
app.get("/staff", (req, res) => {
    res.json(readData());
});

// POST
app.post("/staff", (req, res) => {
    const data = readData();
    const newStaff = { id: Date.now().toString(), ...req.body };

    data.push(newStaff);
    writeData(data);

    res.json(newStaff);
});

// DELETE
app.delete("/staff/:id", (req, res) => {
    const data = readData().filter((s) => s.id !== req.params.id);
    writeData(data);
    res.json({ success: true });
});

app.listen(5000, () =>
    console.log("✅ Server running http://localhost:5000")
);