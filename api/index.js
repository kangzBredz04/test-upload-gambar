import express from "express";
import "dotenv/config";
import cors from "cors";
import multer from "multer";
import { pool } from "./config/db.js";

const app = express()

app.use(
    cors({
        origin: ["http://localhost:5173", "https://serikat-pekerja-btn.vercel.app"],
        credentials: true,
    })
);

app.use(express.json());
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const { originalname, mimetype, buffer } = req.file;
        const base64Image = buffer.toString("base64");

        const query = `INSERT INTO images (filename, mimetype, image_base64) VALUES ($1, $2, $3) RETURNING *`;
        const values = [originalname, mimetype, base64Image];

        const result = await pool.query(query, values);
        res.json({
            success: true,
            message: "Gambar berhasil diunggah!",
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Upload gagal!" });
    }
})

app.get("/image/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const query = `SELECT * FROM images WHERE id = $1`;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Gambar tidak ditemukan!" });
        }

        const image = result.rows[0];
        const imgBuffer = Buffer.from(image.image_base64, "base64");

        res.writeHead(200, {
            "Content-Type": image.mimetype,
            "Content-Length": imgBuffer.length,
        });

        res.end(imgBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal mengambil gambar!" });
    }
});

app.listen(process.env.API_PORT, () =>
    console.log("Server berhasil dijalankan.")
);