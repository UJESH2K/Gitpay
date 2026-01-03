// Test utility - test the GitHub Pay system

const http = require("http");

// Test webhook endpoint
function testWebhook(backendUrl = "http://localhost:3000") {
  const payload = {
    action: "created",
    comment: {
      body: "/pay 50",
      user: { login: "test-maintainer" }
    },
    issue: {
      number: 123,
      pull_request: {},
      user: { login: "test-contributor" }
    },
    repository: {
      name: "test-repo",
      owner: { login: "test-org" }
    }
  };

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/webhook/github",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": JSON.stringify(payload).length
    }
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("\n✅ Webhook Response:");
      try {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } catch {
        console.log(data);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Error:", error.message);
  });

  console.log("📤 Sending test webhook...");
  req.write(JSON.stringify(payload));
  req.end();
}

// Test health endpoint
function testHealth(backendUrl = "http://localhost:3000") {
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/health",
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("\n✅ Health Check:");
      try {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } catch {
        console.log(data);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Error:", error.message);
  });

  console.log("📤 Checking backend health...");
  req.end();
}

// Main
const command = process.argv[2] || "health";

console.log("\n🧪 GitHub Pay Test Utility");
console.log("===========================\n");

if (command === "health") {
  testHealth();
} else if (command === "webhook") {
  testWebhook();
} else {
  console.log("Usage: node test.js [health|webhook]");
  console.log("\nExamples:");
  console.log("  node test.js health    # Check if backend is running");
  console.log("  node test.js webhook   # Send test webhook payload");
}
