const jose = require("node-jose");
const fs = require("fs");

// Đọc khóa công khai
const publicKeyPem = fs.readFileSync("public.key", "utf8");
console.log(111111111, publicKeyPem);

const data = fs.readFileSync("data.txt", "utf8");
const signature = fs.readFileSync("data.sig", "utf8");
console.log("data", data);
console.log("signature", signature);

// // Tạo JWKS
// jose.JWK.asKey(publicKeyPem, 'pem')
//     .then(key => {
//         const jwks = {
//             keys: [key.toJSON(true)] // true để bao gồm cả khóa công khai
//         };
//         fs.writeFileSync('jwks.json', JSON.stringify(jwks, null, 2));
//     });

jose.JWK.asKey(publicKeyPem, "pem", { alg: "RS256", use: 'sig' })
    .then((key) => {
        console.log("key", key);
        return jose.JWS.createVerify(key)
            .verify(signature, data)
            .then((res) => {
                console.log("res", res);
                console.log("Signature verified successfully");
                const jwks = {
                    keys: [key.toJSON(true)] // true để bao gồm tất cả các thuộc tính
                };
                fs.writeFileSync('jwks.json', JSON.stringify(jwks, null, 2));
            });
    })
    //   .then(key => {
    //     //   console.log('res', res)
    //     //   Tạo JWKS với các thuộc tính cần thiết
    //       console.log('key', key)
    //       const jwks = {
    //           keys: [{
    //               kty: key.kty,       // Key Type
    //               kid: key.kid,       // Key ID
    //               use: 'sig',         // Usage - chữ ký
    //               alg: key.alg,       // Thuật toán
    //               n: key.n,           // Modulus (Số dư) cho RSA
    //               e: key.e            // Exponent (Số mũ) cho RSA
    //           }]
    //       };
    //       fs.writeFileSync('jwks.json', JSON.stringify(jwks, null, 2));
    //   })
    .catch((err) => {
        console.error("Error creating JWKS:", err);
    });
