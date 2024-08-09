const jose = require("node-jose");
const fs = require("fs");

// Đọc khóa bí mật từ file
const privateKeyPem = fs.readFileSync("private.key", "utf8");

// Đọc dữ liệu để ký
const data = fs.readFileSync("data.txt", "utf8");

// Chuyển đổi khóa bí mật thành JWK
jose.JWK.asKey(privateKeyPem, "pem", { alg: "RS256" })
  .then((key) => {
    const jwks = {
      keys: [key.toJSON(true)] // true để bao gồm tất cả các thuộc tính
    };
    fs.writeFileSync('jwks.json', JSON.stringify(jwks, null, 2));
    return jose.JWS.createSign({ format: "compact", alg: "RS256" }, key)
      .update(data)
      .final();
  })
  .then((signature) => {
    fs.writeFileSync("data.sig", signature);
    console.log("Data signed successfully");
  })
  .catch((err) => {
    console.error("Error signing data:", err);
  });
