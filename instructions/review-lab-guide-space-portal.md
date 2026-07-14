# 🚀 Hands-On Lab: Build an Intergalactic Space Station Portal

## Lab Overview

Welcome to the team, Cadet! Today, you are going to write code that runs directly at the **"Edge"**—which means your application will instantly deploy and run on servers distributed all over planet Earth via Akamai Functions (built on the WebAssembly-powered Spin framework).

You will use **TypeScript** to build a command portal for a futuristic space station. By the end of this lab, your app will handle incoming space traffic, launch a digital probe to track the real-world International Space Station, and save cargo manifests securely inside the ship's digital vault.

### What You Will Learn

1. How to initialize a serverless application using the `spin` developer tool.
2. How to create custom web links (called **Routes**) using a beginner-friendly routing engine called **Hono**.
3. How to make your code speak to external web networks using **Outbound HTTP Fetch**.
4. How to store information persistently across the universe using a lightning-fast **Key-Value Store**.

---

## 🛠️ Phase 1: Building the Ship (Project Setup)

Before writing our custom control systems, we need to generate the basic structure of our space application.

### 📋 Participant Instructions

1. Open your computer's terminal or command prompt application.
2. Run the following command to create a brand new TypeScript project layout from a template:

   ```bash
   spin new -t http-ts space-portal
   Description: A beginner friendly Akamai Functions Space Lab
   HTTP path: /...
   HTTP Router: hono
   ```

3. Move into your new project directory:

   ```bash
   cd space-portal
   ```

4. Open this project folder inside your preferred code editor (such as Visual Studio Code).

### 🔍 Understanding the Blueprint

Look at the files inside your project directory. As a beginner, you only need to focus on two distinct structural points:

- `spin.toml`: The **Ship's Manifest**. This configuration file tells Akamai what permissions, network access routes, and secure vaults your application is allowed to handle.
- `src/index.ts`: The **Control Room**. This is the main file where you will write your actual TypeScript code logic.

---

## 🛰️ Phase 2: Customizing the Welcome Screen (Your First Route)

Right now, your application contains templates. Let's configure it to greet any incoming astronauts arriving at the docking bay.

### 📋 Participant Instructions

1. Open the `src/index.ts` file in your editor.
2. Erase everything inside it so you start completely fresh.
3. Paste the following code block to establish **Hono**, a modern routing tool that maps custom URLs to blocks of executable code:

   ```typescript
   import { Hono } from "hono";

   const app = new Hono();

   // ROUTE 1: The Space Station Docking Bay
   app.get("/", (c) => {
     return c.text(
       "🛰️ Welcome to the Intergalactic Edge Space Station, Cadet!",
     );
   });

   app.fire();
   ```

4. Save your file.
5. Test

  ```bash
  spin build
  spin up
  curl 'http://127.0.0.1:3000'
  ```

  Expected output:

  ```
  🛰️ Welcome to the Intergalactic Edge Space Station, Cadet!
  ```

---

## 📡 Phase 3: Launching a Tracking Probe (Outbound HTTP Fetch)

A good space station needs to communicate with external data streams. We are going to write a route that fires a digital communication probe down to Earth to locate the exact real-time coordinates of the actual International Space Station!

To achieve this, we request data from an external tracking API (`api.open-notify.org`). However, Akamai Functions are strictly locked down by default for security. We must give our application explicit permission to talk to the outside universe.

### 📋 Participant Instructions

1. Open your `spin.toml` file.
2. Find the block that reads `[component.space-portal]`.
3. Look for the line that says `allowed_outbound_hosts = []`. Change it to give permission to our target URL host with the full scheme and port:

   ```toml
   allowed_outbound_hosts = ["http://api.open-notify.org:80"]
   ```

   > **Note:** Akamai Functions require the full URL format including the scheme (http:// or https://) and port number for security. We use HTTP (port 80) because this particular API doesn't support HTTPS connections.
4. Go back to `src/index.ts`. Right above the `app.fire()` line, insert your second route code:

   ```typescript
   // ROUTE 2: Locate the ISS
   app.get("/locate-iss", async (c) => {
     try {
       // Fire our data probe to Earth
       const response = await fetch("http://api.open-notify.org/iss-now.json");
       const data = (await response.json()) as any;

       return c.json({
         status: "📡 Connection Stable!",
         message: "Probe intercepted the real-world ISS location!",
         coordinates: data.iss_position,
       });
     } catch (error) {
       return c.text(
         "💥 Space debris blocked our probe! Try again later.",
         500,
       );
     }
   });
   ```

5. Save your updates.
6. Test

  ```bash
  spin build
  spin up
  curl 'http://127.0.0.1:3000/locate-iss'
  ```

  Expected output:

  ```json
  {
    "status": "📡 Connection Stable!",
    "message": "Probe intercepted the real-world ISS location!",
    "coordinates": {
      "longitude": "-41.2690",
      "latitude": "-39.4434"
    }
  }
  ```

---

## 📦 Phase 4: Activating the Memory Core (Key-Value Storage)

When cargo ships deliver provisions (like space cookies or reactor fuel), we need to register them inside the ship's memory core. Because serverless functions execute and clean up immediately after use, we use Akamai's built-in **Key-Value Store** to save data permanently.

Just like before, we have to grant our component structural permission to use the storage room.

### 📋 Participant Instructions

1. Open your `spin.toml` file again.
2. Directly below your `allowed_outbound_hosts` line, add this line to initialize access to the default storage vault:

   ```toml
   key_value_stores = ["default"]
   ```

3. For the kv to work it needs to be included as a dependency. At this stage package.json doesn't include it. Make sure you are in the space-portal directory, your application, and run:

  ```bash
    npm install @spinframework/spin-kv
  ```

  Notice that the dependencies have updated to look like:

  ```json
  "dependencies": {
    "@spinframework/build-tools": "^1.0.4",
    "@spinframework/spin-kv": "^1.0.1",
    "@spinframework/wasi-http-proxy": "^1.0.0",
    "hono": "^4.7.4"
  }
  ```

4. Return to `src/index.ts` and lets import our Kv

  ```typescript
  import * as Kv from "@spinframework/spin-kv";
  ```

5. Still in `src/index.ts`. Let's add two final routes right above the `app.fire()` statement to **store** cargo and **inspect** what is saved inside the vault:

   ```typescript
   // ROUTE 3: Load Cargo into the Vault
   app.get("/load-cargo", (c) => {
     // Check the URL query parameter for an item name, or default to Space Biscuits
     const cargoItem = c.req.query("item") || "Space Biscuits";

     // Open the ship's secure vault
     const vault = Kv.openDefault();

     // Save our cargo details safely as a simple object
     vault.setJson("manifest", {
       item: cargoItem,
       timestamp: new Date().toISOString(),
     });

     return c.text(
       `📦 Successfully locked [${cargoItem}] inside the ship's storage vault!`,
     );
   });

   // ROUTE 4: Inspect the Vault
   app.get("/check-vault", (c) => {
     const vault = Kv.openDefault();

     // Pull the item data back out of the vault
     const currentCargo = vault.getJson("manifest");

     if (!currentCargo) {
       return c.text("⚠️ Warning! The storage vault is completely empty!");
     }

     return c.json({
       vault_status: "Secured",
       current_inventory: currentCargo,
     });
   });
   ```

2. Save your files.
3. Test

  ```bash
  spin build
  spin up
  curl 'http://127.0.0.1:3000/load-cargo?item=Quantum-Fuel'
  ```

  Expected output:

  ```
  📦 Successfully locked [Quantum-Fuel] inside the ship's storage vault!
  ```

  ```bash
  curl http://127.0.0.1:3000/check-vault
  ```

  Expected output:

  ```json
  {
    "vault_status":"Secured",
    "current_inventory": {
      "item":"Quantum-Fuel",
      "timestamp":"2026-07-14T15:31:02.879Z"
    }
  }
  ```

---

## 🚀 Phase 5: Launching into Orbit (Testing & Deploying)

Your space code is fully assembled! Now it is time to boot up the systems, test it inside your local terminal simulator, and launch it live to Akamai's global edge network.

### 📋 Participant Instructions

1. In your terminal, run this command to build and compile your TypeScript code into a high-performance WebAssembly module:

   ```bash
   spin build
   ```

2. Once the build finishes cleanly, start your local simulator network:

   ```bash
   spin up
   ```

3. Your terminal will print an address (usually `http://localhost:3000`). Open your internet browser and navigate to these distinct endpoints to test your work:
   - `http://localhost:3000/` (Welcome Docking Message)
   - `http://localhost:3000/locate-iss` (Real-time tracking coordinate probe)
   - `http://localhost:3000/load-cargo?item=Quantum-Fuel` (Saves your cargo tracking query!)
   - `http://localhost:3000/check-vault` (Reads whatever you locked in your vault)
4. **Deploy Globally:** When you're ready to show the world, press `CTRL + C` to turn off the local server, and deploy your code live to the real internet via Akamai Functions using:

   ```bash
   spin aka deploy
   ```

---

## 🧑‍🏫 Instructor's Cheat Sheet (Solutions Guide)

If a student runs into a syntax error, structural bug, or misconfigures a setup path, use these exact complete file contents to get them back up and running instantly.

### `spin.toml` Complete Final Blueprint

```toml
spin_manifest_version = "2"

[application]
name = "space-portal"
version = "0.1.0"
authors = ["Astronaut Cadet"]
description = "A beginner friendly Akamai Functions Space Lab"

[[trigger.http]]
route = "/..."
component = "space-portal"

[component.space-portal]
source = "dist/space-portal.wasm"
exclude_files = ["src/**/*.ts", "macro/**/*.ts", "node_modules/**"]
allowed_outbound_hosts = ["http://api.open-notify.org:80"]
key_value_stores = ["default"]

[component.space-portal.build]
command = "npm run build"
watch = ["src/**/*.ts", "package.json"]
```

### `src/index.ts` Complete Final Code

```typescript
import { Hono } from "hono";
import { Kv } from "@fermyon/spin-sdk";

const app = new Hono();

// ROUTE 1: Welcome Greeting
app.get("/", (c) => {
  return c.text("🛰️ Welcome to the Intergalactic Edge Space Station, Cadet!");
});

// ROUTE 2: Fetching External Space Probe Data
app.get("/locate-iss", async (c) => {
  try {
    const response = await fetch("http://api.open-notify.org/iss-now.json");
    const data = (await response.json()) as any;

    return c.json({
      status: "📡 Connection Stable!",
      message: "Probe intercepted the real-world ISS location!",
      coordinates: data.iss_position,
    });
  } catch (error) {
    return c.text("💥 Space debris blocked our probe! Try again later.", 500);
  }
});

// ROUTE 3: Saving Information to the Key-Value Vault
app.get("/load-cargo", (c) => {
  const cargoItem = c.req.query("item") || "Space Biscuits";
  const vault = Kv.openDefault();

  vault.setJson("manifest", {
    item: cargoItem,
    timestamp: new Date().toISOString(),
  });

  return c.text(
    `📦 Successfully locked [${cargoItem}] inside the ship's storage vault!`,
  );
});

// ROUTE 4: Reading Information from the Key-Value Vault
app.get("/check-vault", (c) => {
  const vault = Kv.openDefault();
  const currentCargo = vault.getJson("manifest");

  if (!currentCargo) {
    return c.text("⚠️ Warning! The storage vault is completely empty!");
  }

  return c.json({
    vault_status: "Secured",
    current_inventory: currentCargo,
  });
});

app.fire();
```

---

## 🔧 Troubleshooting Guide

### Issue: "Could not resolve 'hono'" or "Could not resolve '@fermyon/spin-sdk'"

**Cause:** The required npm packages are not installed.

**Solution:** Run the following command in your project directory:

```bash
npm install hono @fermyon/spin-sdk
```

### Issue: "NetworkError when attempting to fetch resource" on /locate-iss route

**Cause:** The `allowed_outbound_hosts` configuration is incorrect or incomplete.

**Solution:** Make sure your `spin.toml` has the full URL format with scheme and port:

```toml
allowed_outbound_hosts = ["http://api.open-notify.org:80"]
```

Also verify the fetch URL in your code uses `http://` not `https://`:

```typescript
const response = await fetch("http://api.open-notify.org/iss-now.json");
```

### Issue: "Port 3000 is already in use"

**Cause:** Another instance of `spin up` is still running.

**Solution:** Either:

- Stop the previous instance with `CTRL + C` in that terminal, or
- Run `pkill -f "spin up"` to force stop all Spin instances, or
- Use a different port with `spin up --listen 127.0.0.1:3001`

### Issue: Build fails with "no world named 'http'" or similar errors

**Cause:** The build tools may need proper configuration.

**Solution:** Verify your `package.json` build script includes:

```json
"build": "node build.mjs && mkdirp dist && j2w -i build/bundle.js --trigger-type spin3-http -o dist/space-portal.wasm"
```

### Issue: TypeScript errors or warnings in tsconfig.json

**Cause:** TypeScript configuration may need updating for modern module resolution.

**Solution:** Update your `tsconfig.json` to include:

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "moduleResolution": "bundler"
  }
}
```

---

## 🎓 Learning Outcomes Summary

Congratulations, Cadet! By completing this lab, you have:

✅ Built a serverless application that runs on the edge using WebAssembly  
✅ Created multiple HTTP routes using the Hono routing framework  
✅ Made external HTTP requests to real-world APIs  
✅ Stored and retrieved persistent data using Key-Value storage  
✅ Learned how to configure security permissions for network access  
✅ Deployed code that runs globally on Akamai's distributed edge network

You're now ready to build your own edge applications! 🚀
