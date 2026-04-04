const fs = require("fs");
const path = require("path");

class JsonDB {
  constructor(dataPath) {
    this.dbPath = path.join(dataPath, "lexsecure-data.json");
    this.pdfsDir = path.join(dataPath, "pdfs");
    fs.mkdirSync(this.pdfsDir, { recursive: true });
    if (!fs.existsSync(this.dbPath)) {
      this._write({ pdfs: [], nextId: 1 });
    }
  }

  _read() {
    try {
      return JSON.parse(fs.readFileSync(this.dbPath, "utf8"));
    } catch {
      return { pdfs: [], nextId: 1 };
    }
  }

  _write(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), "utf8");
  }

  getPdfsDir() {
    return this.pdfsDir;
  }

  getAllPdfs() {
    const db = this._read();
    return [...db.pdfs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getPdfById(id) {
    const db = this._read();
    return db.pdfs.find((p) => p.id === id) || null;
  }

  insertPdf({ originalName, storedPath, fileSize, expiryDate }) {
    const db = this._read();
    const now = new Date().toISOString();
    const record = {
      id: db.nextId++,
      originalName,
      storedPath,
      fileSize,
      expiryDate,
      createdAt: now,
      updatedAt: now,
    };
    db.pdfs.push(record);
    this._write(db);
    return record;
  }

  deletePdf(id) {
    const db = this._read();
    const idx = db.pdfs.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const [record] = db.pdfs.splice(idx, 1);
    this._write(db);
    return record;
  }

  getStats() {
    const db = this._read();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let active = 0;
    let expired = 0;
    let totalSize = 0;
    for (const p of db.pdfs) {
      totalSize += p.fileSize;
      if (new Date(p.expiryDate) < now) expired++;
      else active++;
    }
    return { total: db.pdfs.length, active, expired, totalSize };
  }
}

module.exports = JsonDB;
