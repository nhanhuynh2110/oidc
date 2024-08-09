import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { Provider, Interaction } from "oidc-provider";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import ejs from "ejs";
import cors from "cors";
import fs from "fs";
import { SQLiteAdapter } from "./adapter";

import debug from "debug";

// Cấu hình debug
const log = debug("oidc-provider");
debug.enable("oidc-provider");

log("OIDC Provider LOG is running");

const jwks = JSON.parse(fs.readFileSync("jwks.json", "utf8"));
console.log("jwks", jwks);

declare module "express-session" {
  interface SessionData {
    pkce: { codeVerifier: string };
    tokenSet: any;
  }
}

const client_uri = "http://localhost:3001";
const client_redirect_uri = `http://localhost:3001/callback`;

export const __dirname = dirname(fileURLToPath(import.meta.url));

// Example user database
const users = [{ id: "user1", username: "user1", password: "password1" }];

// Utility functions to find users
const findUserById = (id: string) => users.find((user) => user.id === id);
const findUserByCredentials = (username: string, password: string) =>
  users.find(
    (user) => user.username === username && user.password === password
  );

const oidc = new Provider("http://localhost:3000", {
  clients: [
    {
      client_id: "client_id",
      client_secret: "secret",
      grant_types: ["authorization_code"],
      redirect_uris: [client_redirect_uri],
    },
  ],
  adapter: SQLiteAdapter,
  scopes: ["openid", "profile"],
  async findAccount(ctx, id) {
    const user = findUserById(id);
    if (user) {
      const r = {
        accountId: id,
        async claims() {
          return { sub: id, name: user.username };
        },
      };
      return r;
    }
    return undefined;
  },
  jwks: jwks,
  features: {
    devInteractions: { enabled: true }, // Disable devInteractions if enabled
    deviceFlow: { enabled: true },
    introspection: { enabled: true },
    revocation: { enabled: true },
  },
  cookies: {
    keys: ["your-secret-key-1", "your-secret-key-2"], // Danh sách các khóa để mã hóa cookies
  },
  interactions: {
    // Replace 'devInteractions' with 'interactions'
    url(ctx, interaction: Interaction) {
      // Render the login page template with the transaction ID
      return `/interaction/${interaction.uid}`;
    },
  },
  ttl: {
    AccessToken: 1 * 60 * 60, // 1 hour in seconds
    AuthorizationCode: 10 * 60, // 10 minutes in seconds
    IdToken: 1 * 60 * 60, // 1 hour in seconds
    DeviceCode: 10 * 60, // 10 minutes in seconds
    RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
    Interaction: 1 * 60 * 60, // 1 hour in seconds
    Session: 1 * 24 * 60 * 60, // 1 day in seconds
    Grant: 1 * 60 * 60, // 1 hour in seconds
    ClientCredentials: 1 * 60 * 60, // 1 hour in seconds
  },
});

console.log(oidc);

const app = express();
app.use(
  cors({
    origin: client_uri, // URL của client React
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser("some secret"));
app.use(
  session({
    secret: "another secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Đặt `secure: true` nếu bạn sử dụng HTTPS
  })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/oidc", oidc.callback());

// Middleware để bắt lỗi và render trang lỗi tùy chỉnh
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    res.status(err.status || 500).send(`
      <html>
        <head>
          <title>Error</title>
        </head>
        <body>
          <h1>${err.message}</h1>
          <p>${err.error_description || "An unexpected error occurred"}</p>
        </body>
      </html>
    `);
  } else {
    next();
  }
});

// Define interaction endpoint
app.use("/interaction/:uid", async (req, res, next) => {
  try {
    console.log("req.params.uid", req.params.uid);
    const interaction = await oidc.Interaction.find(req.params.uid);
    console.log("interaction", interaction);
    if (!interaction) {
      return res.status(404).send("Interaction not found");
    }
    // throw new Error("Not implemented");
    res.render("login", { transactionId: interaction.uid });
  } catch (err) {
    next(err);
  }
});

// Define login route
app.post("/interaction/login", async (req, res) => {
  const { transactionId } = req.body;
  const interactionDetails = await oidc.Interaction.find(transactionId);
  console.log("interactionDetails", interactionDetails);
  console.log("req.body", req.body);
  if (interactionDetails) {
    const user = findUserByCredentials(req.body.username, req.body.password);
    console.log("user", user);
    if (user) {
      const result = { login: { accountId: user.id } };
      // await oidc.interactionFinished(req, res, result);
    } else {
      res.status(401).send("Invalid credentials");
    }
  } else {
    res.status(400).send("Invalid transaction");
  }
});

// // Define root route
// app.get("/", async (req, res) => {
//   const codeVerifier = generators.codeVerifier(); // Tạo mã verifier
//   const codeChallenge = await generateChallenge(codeVerifier);
//   req.session.pkce = { codeVerifier }; // Lưu mã verifier vào session để sử dụng sau này

//   const authUrl = new URL("http://localhost:3000/oidc/auth");
//   authUrl.searchParams.append("response_type", "code");
//   authUrl.searchParams.append("client_id", "client");
//   authUrl.searchParams.append("redirect_uri", "http://localhost:3000/cb");
//   authUrl.searchParams.append("scope", "openid profile");
//   authUrl.searchParams.append("code_challenge", codeChallenge);
//   authUrl.searchParams.append("code_challenge_method", "S256");

//   res.redirect(authUrl.toString());
// });

// // Define callback route
// app.get('/cb', async (req, res) => {
//   try {
//     const code = req.query.code as string;
//     const codeVerifier = req.session.pkce?.codeVerifier;
//     console.log(code, codeVerifier);

//     if (!code || !codeVerifier) {
//       return res.status(400).send('Missing code or code verifier');
//     }

//     const issuer = await Issuer.discover('http://localhost:3000/oidc/.well-known/openid-configuration');
//     const client = new issuer.Client({
//       client_id: 'client',
//       client_secret: 'secret',
//     });

//     const tokenSet = await client.callback(redirect_uri, { code }, { code_verifier: codeVerifier });

//     req.session.tokenSet = tokenSet; // Lưu token vào session nếu cần

//     res.send(`Access Token: ${tokenSet.access_token}`);
//   } catch (err: any) {
//     res.status(500).send(`Error: ${err.message}`);
//   }
// });

app.listen(3000, () => {
  console.log("OIDC Provider running at http://localhost:3000");
});
