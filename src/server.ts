import path from "path";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Issuer, Strategy } from "openid-client";
import jwt from "jsonwebtoken";

import * as config from "./config";

export const start = async () => {
  console.log("starting server");
  const server = express();

  server.use(cookieParser());
  server.use(bodyParser.json());
  server.use(
    session({
      secret: "my_supersecret_secret",
      resave: false,
      saveUninitialized: true
    })
  );

  server.use(passport.initialize());
  server.use(passport.session());

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  const eidIssuer = await Issuer.discover(
    `${config.ENVIRONMENT === "development" ? "http" : "https"}://${
      config.PROVIDER_HOST
    }`
  );

  const eidClient = new eidIssuer.Client({
    redirect_uri: config.REDIRECT_URI,
    client_id: config.CLIENT_ID,
    token_endpoint_auth_method: "client_secret_post",
    client_secret: config.CLIENT_SECRET
  });

  passport.use(
    "oidc",
    new Strategy(
      {
        client: eidClient,
        params: {
          client_id: config.CLIENT_ID,
          redirect_uri: config.REDIRECT_URI,
          scope: "openid signature",
          response_type: "code",
          state: "testing",
          bankid_sign_text: Buffer.from("Testar text").toString("base64"),
          bankid_sign_text_hidden: Buffer.from("Dold testtext").toString(
            "base64"
          )
        }
      },
      (tokenset: any, userinfo: any, done: any) => {
        done(null, {
          id: tokenset.claims.sub,
          ...tokenset,
          ...tokenset.claims,
          userinfo
        });
      }
    )
  );

  server
    .disable("x-powered-by")
    .get("/login", (req, res) => {
      res.status(200).send(`<!doctype html>
  <html lang="">
  <head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login - XDC IDP</title>
    <link rel="shortcut icon" type="icon/ico" href="/static/favicon.ico"/>
    <link href="/static/index.css" rel="stylesheet">
  </head>
  <body>
    <div class="mask"></div>
    <div class="container">
      <h1>XDC IDP Client</h1>
      <a href="/auth">Logga in</a>
    </div>
  </body>
  </html>`);
    })
    .use("/static", express.static(path.resolve(__dirname, "..", "public")))
    .get("/auth", passport.authenticate("oidc"))
    .get(
      "/auth/cb",
      passport.authenticate("oidc", {
        successRedirect: "/",
        failureRedirect: "/login"
      }),
      (req, res) => {
        res.status(401).send("Login");
      }
    )
    .get(
      "/",
      (req, res, next) => {
        if (req.isAuthenticated()) {
          // req.user is available for use here
          return next();
        }

        // denied. redirect to login
        res.redirect("/login");
      },
      (req, res) => {
        const user = req.user;

        const idToken = jwt.decode(user.id_token, {
          complete: true,
          json: true
        }) as {
          header: { [key: string]: string };
          payload: { [key: string]: string };
        };

        res.status(200).send(`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Information - XDC IDP</title>
        <link rel="shortcut icon" type="icon/ico" href="/static/favicon.ico"/>
        <link href="/static/index.css" rel="stylesheet">
      </head>
      <body>
        <div class="container white">
          <h1>Welcome ${user.givenName} ${user.surname}</h1>

          <h2>access_token:</h2>
          <div class="card">
            <pre><code class="wrap">${user.access_token}</code></pre>
          </div>

          <h2>id_token</h2>

          <div class="card">
            <h3>HEADER</h3>
            <pre><code class="qa-id_token-header">${JSON.stringify(
              idToken.header,
              null,
              2
            )}</code></pre>
          </div>
          
          <div class="card">
            <h3>PAYLOAD</h3>
            <pre><code class="qa-id_token-payload">${JSON.stringify(
              idToken.payload,
              null,
              2
            )}</code></pre>
          </div>
          
          <div class="card">
            <h3>USERINFO</h3>
            <pre><code class="qa-id_token-payload">${JSON.stringify(
              user.userinfo,
              null,
              2
            )}</code></pre>
          </div>
        </div>
      </body>
      </thml>`);
      }
    );

  return server.listen(config.PORT, () => {
    console.log(`Listening on port ${config.PORT}`);
  });
};
