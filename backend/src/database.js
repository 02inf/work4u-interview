const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../data/digests.db');

// 创建数据库连接
function createConnection() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// 初始化数据库表
async function initDatabase() {
  const db = await createConnection();
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 创建摘要表
      db.run(`
        CREATE TABLE IF NOT EXISTS digests (
          id TEXT PRIMARY KEY,
          transcript TEXT NOT NULL,
          summary TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('摘要表创建成功');
          resolve();
        }
      });
    });
    
    db.close();
  });
}

// 插入新摘要
async function insertDigest(id, transcript, summary) {
  const db = await createConnection();
  
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO digests (id, transcript, summary) 
      VALUES (?, ?, ?)
    `);
    
    stmt.run([id, transcript, JSON.stringify(summary)], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, transcript, summary, createdAt: new Date().toISOString() });
      }
    });
    
    stmt.finalize();
    db.close();
  });
}

// 获取所有摘要
async function getAllDigests() {
  const db = await createConnection();
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT id, transcript, summary, createdAt 
      FROM digests 
      ORDER BY createdAt DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const digests = rows.map(row => ({
          ...row,
          summary: JSON.parse(row.summary)
        }));
        resolve(digests);
      }
    });
    
    db.close();
  });
}

// 根据ID获取摘要
async function getDigestById(id) {
  const db = await createConnection();
  
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT id, transcript, summary, createdAt 
      FROM digests 
      WHERE id = ?
    `, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const digest = {
          ...row,
          summary: JSON.parse(row.summary)
        };
        resolve(digest);
      } else {
        resolve(null);
      }
    });
    
    db.close();
  });
}

module.exports = {
  initDatabase,
  insertDigest,
  getAllDigests,
  getDigestById
};
