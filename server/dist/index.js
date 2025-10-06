import "dotenv/config";
import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
// quick test route
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, serverTime: new Date().toISOString() });
});
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});
