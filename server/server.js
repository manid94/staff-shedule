const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================================
   📌 FILE PATH
========================================= */
const filePath = path.join(__dirname, "staff.json");

/* =========================================
   📌 GET STAFF
========================================= */
app.get("/staff", (req, res) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
        }

        const data = fs.readFileSync(filePath, "utf-8");
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Error reading staff:", err);
        res.status(500).json({ error: "Failed to read staff" });
    }
});

/* =========================================
   📌 ADD STAFF
========================================= */
app.post("/staff", (req, res) => {
    try {
        let data = [];

        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }

        const newStaff = {
            id: Date.now().toString(), // ✅ unique id
            ...req.body
        };

        data.push(newStaff);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        res.json({ success: true });
    } catch (err) {
        console.error("Error saving staff:", err);
        res.status(500).json({ error: "Failed to save staff" });
    }
});

/* =========================================
   ❌ DELETE STAFF (NEW)
========================================= */
app.delete("/staff/:id", (req, res) => {
    try {
        const { id } = req.params;

        if (!fs.existsSync(filePath)) {
            return res.json({ success: true });
        }

        let data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // remove staff
        data = data.filter((s) => s.id !== id);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting staff:", err);
        res.status(500).json({ error: "Failed to delete staff" });
    }
});

/* =========================================
   🔥 SERVE REACT BUILD
========================================= */

const distPath = path.resolve(__dirname, "../client/dist");

console.log("📦 React dist path:", distPath);

if (!fs.existsSync(distPath)) {
    console.error(
        "❌ ERROR: client/dist not found.\n👉 Run: cd client && npm run build"
    );
}

app.use(express.static(distPath));

app.use(express.static(distPath));

// ✅ SAFE fallback (works in all versions)
app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// app.get("/*", (req, res) => {
//     res.sendFile(path.join(distPath, "index.html"));
// });

/* =========================================
   🚀 START SERVER
========================================= */

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});