// Database module - SQLite3 wrapper for storing rewards and users

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data", "github-pay.db");

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeTables();
  }
});

// Promisify database operations
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize tables
function initializeTables() {
  const createRewardsTable = `
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      repo TEXT NOT NULL,
      pr INTEGER NOT NULL,
      amount REAL NOT NULL,
      token TEXT DEFAULT 'SOL',
      issued_by TEXT NOT NULL,
      recipient TEXT NOT NULL,
      recipient_wallet TEXT,
      status TEXT DEFAULT 'pending',
      tx_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      redeemed_at DATETIME,
      UNIQUE(repo, pr, issued_by, recipient)
    )
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      github_username TEXT PRIMARY KEY,
      solana_wallet TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createMaintenersTable = `
    CREATE TABLE IF NOT EXISTS maintainers (
      github_username TEXT PRIMARY KEY,
      repos TEXT,
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.serialize(() => {
    db.run(createRewardsTable, (err) => {
      if (err) console.error("Error creating rewards table:", err);
      else console.log("✓ Rewards table initialized");
    });

    db.run(createUsersTable, (err) => {
      if (err) console.error("Error creating users table:", err);
      else console.log("✓ Users table initialized");
    });

    db.run(createMaintenersTable, (err) => {
      if (err) console.error("Error creating maintainers table:", err);
      else console.log("✓ Maintainers table initialized");
    });
  });
}

// Reward operations
const Reward = {
  create: async (rewardData) => {
    const {
      id,
      repo,
      pr,
      amount,
      issuedBy,
      recipient,
      token = "SOL"
    } = rewardData;

    const sql = `
      INSERT INTO rewards (id, repo, pr, amount, token, issued_by, recipient, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    return dbRun(sql, [id, repo, pr, amount, token, issuedBy, recipient]);
  },

  findByRepoAndPR: async (repo, pr) => {
    const sql = `
      SELECT * FROM rewards 
      WHERE repo = ? AND pr = ? AND status = 'pending'
      LIMIT 1
    `;
    return dbGet(sql, [repo, pr]);
  },

  findById: async (id) => {
    const sql = `SELECT * FROM rewards WHERE id = ?`;
    return dbGet(sql, [id]);
  },

  findByRecipient: async (recipient) => {
    const sql = `
      SELECT * FROM rewards 
      WHERE recipient = ? AND status = 'pending'
      ORDER BY created_at DESC
    `;
    return dbAll(sql, [recipient]);
  },

  updateStatus: async (id, status, txHash = null) => {
    const sql = `
      UPDATE rewards 
      SET status = ?, tx_hash = ?, redeemed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    return dbRun(sql, [status, txHash, id]);
  },

  updateWallet: async (id, wallet) => {
    const sql = `
      UPDATE rewards 
      SET recipient_wallet = ?
      WHERE id = ?
    `;
    return dbRun(sql, [wallet, id]);
  }
};

// User operations
const User = {
  create: async (githubUsername, solanaWallet) => {
    const sql = `
      INSERT OR REPLACE INTO users (github_username, solana_wallet, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    return dbRun(sql, [githubUsername, solanaWallet]);
  },

  findByGithub: async (githubUsername) => {
    const sql = `SELECT * FROM users WHERE github_username = ?`;
    return dbGet(sql, [githubUsername]);
  },

  findByWallet: async (wallet) => {
    const sql = `SELECT * FROM users WHERE solana_wallet = ?`;
    return dbGet(sql, [wallet]);
  }
};

// Maintainer operations
const Maintainer = {
  create: async (githubUsername, repos = "") => {
    const sql = `
      INSERT OR REPLACE INTO maintainers (github_username, repos)
      VALUES (?, ?)
    `;
    return dbRun(sql, [githubUsername, repos]);
  },

  findByGithub: async (githubUsername) => {
    const sql = `SELECT * FROM maintainers WHERE github_username = ?`;
    return dbGet(sql, [githubUsername]);
  }
};

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll,
  Reward,
  User,
  Maintainer
};
