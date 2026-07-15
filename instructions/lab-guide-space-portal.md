# 🚀 Hands-On Lab: Build a Cargo Spaceship Mission Control System

## Lab Overview

Welcome to the crew, Mission Specialist! Today, you are going to write code that runs directly at the **"Edge"**—which means your application will instantly deploy and run on servers distributed all over planet Earth via Akamai Functions (built on the WebAssembly-powered Spin framework).

You are building the digital control system for a cargo spaceship that transports essential supplies from Earth to the International Space Station. Your application will track the ISS in real-time, calculate optimal intercept courses, and manage cargo manifests. You'll start with **TypeScript** for the main Mission Control interface, then add a specialized **Rust** component as the ship's Flight Computer—learning how to build **multi-component applications** where different programming languages work together, each chosen for what it does best.

### What You Will Learn:

1. How to initialize a serverless application using the `spin` developer tool.
2. How to create custom web links (called **Routes**) using a beginner-friendly routing engine called **Hono**.
3. How to make your code speak to external web networks using **Outbound HTTP Fetch**.
4. How to store information persistently using a lightning-fast **Key-Value Store**.
5. How to build **multi-component applications** combining TypeScript and Rust.
6. How to implement **Local Service Chaining** for inter-component communication.

---

## 🛠️ Phase 1: Initializing Mission Control (Project Setup)

Before writing our mission control systems, we need to generate the basic structure of our cargo spaceship application.

### 📋 Participant Instructions:

1. Open your computer's terminal or command prompt application.
2. Run the following command to create a brand new TypeScript project layout from a template:
   ```bash
   spin new -t http-ts space-portal --accept-defaults
   ```
3. Move into your new project directory:
   ```bash
   cd space-portal
   ```
4. Open this project folder inside your preferred code editor (such as Visual Studio Code).

### 🔍 Understanding the Blueprint

Look at the files inside your project directory. As a beginner, you only need to focus on two distinct structural points:

- `spin.toml`: The **Mission Manifest**. This configuration file tells Akamai what permissions, network access routes, and secure storage your application is allowed to handle.
- `src/index.ts`: The **Mission Control Center**. This is the main file where you will write your TypeScript code for orchestrating the cargo mission.

---

## 🛰️ Phase 2: Setting Up Mission Control Interface (Your First Route)

Right now, your application contains templates. Let's configure it to greet mission operators accessing the cargo spaceship control system.

### 📋 Participant Instructions:

1. Open the `src/index.ts` file in your editor.
2. Erase everything inside it so you start completely fresh.
3. Paste the following code block to establish **Hono**, a modern routing tool that maps custom URLs to blocks of executable code:

   ```typescript
   import { Hono } from "hono";
   import * as Kv from "@spinframework/spin-kv";

   const app = new Hono();

   // ROUTE 1: Mission Control Welcome
   app.get("/", (c) => {
     return c.text(
       "🚀 Cargo Spaceship Mission Control - Ready for ISS supply run!",
     );
   });

   app.fire();
   ```

4. Save your file.

---

## 📡 Phase 3: Tracking the ISS (Outbound HTTP Fetch)

Our cargo spaceship needs to know where the International Space Station is at all times. We are going to write a route that queries a real-time ISS tracking API to get the current coordinates of our destination. Later, we'll use this data to calculate an intercept course using our Flight Computer.

To achieve this, we request data from an external tracking API (`api.open-notify.org`). However, Akamai Functions are strictly locked down by default for security. We must give our application explicit permission to talk to the outside universe.

### 📋 Participant Instructions:

1. Open your `spin.toml` file.
2. Find the block that reads `[component.space-portal]`.
3. Look for the line that says `allowed_outbound_hosts = []`. Change it to give permission to our target URL host with the full scheme and port:
   ```toml
   allowed_outbound_hosts = ["http://api.open-notify.org:80"]
   ```
   > **Note:** Akamai Functions require the full URL format including the scheme (http:// or https://) and port number for security. We use HTTP (port 80) because this particular API doesn't support HTTPS connections.
4. Go back to `src/index.ts`. Right above the `app.fire()` line, insert your second route code. For now, we'll create a simple version that just fetches the ISS location. We'll enhance it with our Flight Computer in Phase 5:

   ```typescript
   // ROUTE 2: Locate the ISS (Basic Version)
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

> **Note:** In Phase 5, we'll upgrade this route to integrate with our onboard Flight Computer!

---

## 📦 Phase 4: Managing the Cargo Manifest (Key-Value Storage)

As we load supplies onto our cargo spaceship (like emergency rations, spare parts, or scientific equipment), we need to maintain a digital manifest. Because serverless functions execute and clean up immediately after use, we use Akamai's built-in **Key-Value Store** to save our cargo inventory permanently.

Just like before, we have to grant our component structural permission to use the storage room.

### 📋 Participant Instructions:

1. Open your `spin.toml` file again.
2. Directly below your `allowed_outbound_hosts` line, add this line to initialize access to the cargo manifest database:
   ```toml
   key_value_stores = ["default"]
   ```
3. Return to `src/index.ts`. Let's add two final routes right above the `app.fire()` statement to **load** cargo items and **check** the manifest:

   ```typescript
   // ROUTE 3: Load Cargo onto the Spaceship
   app.get("/load-cargo", (c) => {
     // Check the URL query parameter for an item name, or default to Space Biscuits
     const cargoItem = c.req.query("item") || "Space Biscuits";

     // Open the cargo manifest database
     const vault = Kv.openDefault();

     // Read existing cargo manifest (array of items)
     let existingManifest;
     try {
       existingManifest = vault.getJson("manifest");
       if (!existingManifest) {
         existingManifest = [];
       }
     } catch (e) {
       // Key doesn't exist or has invalid JSON, start fresh
       existingManifest = [];
     }

     // Add the new cargo item to the manifest
     existingManifest.push({
       item: cargoItem,
       timestamp: new Date().toISOString(),
     });

     // Save the updated manifest back to the vault
     vault.setJson("manifest", existingManifest);

     return c.text(
       `📦 Successfully loaded [${cargoItem}] onto the spaceship! Total items: ${existingManifest.length}`,
     );
   });

   // ROUTE 4: Check the Cargo Manifest
   app.get("/check-vault", (c) => {
     const vault = Kv.openDefault();

     // Pull the manifest data back out
     const currentCargo = vault.getJson("manifest");

     if (!currentCargo || currentCargo.length === 0) {
       return c.text("⚠️ Warning! No cargo loaded on the spaceship!");
     }

     return c.json({
       vault_status: "Secured",
       total_items: currentCargo.length,
       cargo_manifest: currentCargo,
     });
   });
   ```

4. Save your files.

> **Pro Tip**: In a real cargo spaceship, you'd want authentication and authorization for cargo management. For this lab, we're keeping it simple to focus on the core Spin concepts!

---

## 🤖 Phase 5: Installing the Flight Computer (Multi-Component Architecture with Rust)

Now we're going to enhance our cargo spaceship by adding a specialized **Flight Computer** component written in **Rust**. This demonstrates one of the most powerful features of Spin: building **multi-component applications** where different parts of your system are written in different languages, each optimized for their specific task.

Think of it this way: **Mission Control** (TypeScript) handles communication, cargo management, and orchestration—things that involve a lot of API calls and data manipulation. The **Flight Computer** (Rust) handles precision navigation calculations, where type safety, performance, and reliability are critical for the crew's safety.

### Why Two Languages?

**Mission Control (TypeScript)**:

- Excellent for HTTP handling and API orchestration
- Great for managing cargo manifests and external communications
- Quick to write and iterate on business logic

**Flight Computer (Rust)**:

- Perfect for mission-critical navigation calculations
- Strong type system prevents errors that could endanger the crew
- Blazing fast performance for real-time course corrections
- Memory safety guarantees for long-duration missions

The two components communicate using **Local Service Chaining**—they call each other in-memory without network overhead, just like integrated systems on a real spacecraft!

### 📋 Participant Instructions:

#### Step 1: Generate the Rust Component

1. Open your terminal in the project directory.
2. Run this command to create a new Rust HTTP component:
   ```bash
   spin add -t http-rust flight-computer --accept-defaults
   ```
3. This creates a new `flight-computer/` directory with Rust code inside.

#### Step 2: Implement the Flight Computer Logic

1. Open `flight-computer/Cargo.toml` and add the dependencies we need for JSON handling:

   ```toml
   [dependencies]
   anyhow = "1"
   spin-sdk = "5.0.0"
   serde = { version = "1.0", features = ["derive"] }
   serde_json = "1.0"
   ```

2. Open `flight-computer/src/lib.rs` and replace all the code with our navigation logic:

   ```rust
   use spin_sdk::http::{IntoResponse, Request, Response};
   use spin_sdk::http_component;
   use serde::{Deserialize, Serialize};

   // Fixed spaceship position (docked at Kennedy Space Center)
   const SPACESHIP_LATITUDE: f64 = 28.5729;
   const SPACESHIP_LONGITUDE: f64 = -80.6490;

   // Simple fuel consumption rate (fuel units per km)
   const FUEL_RATE: f64 = 0.42;

   /// Request payload from Mission Control
   #[derive(Deserialize)]
   struct IssRequest {
       iss: Coordinates,
   }

   /// ISS coordinates
   #[derive(Deserialize)]
   struct Coordinates {
       latitude: f64,
       longitude: f64,
   }

   /// Mission report response
   #[derive(Serialize)]
   struct MissionReport {
       #[serde(rename = "distanceKm")]
       distance_km: f64,
       #[serde(rename = "fuelRequired")]
       fuel_required: f64,
       status: String,
   }

   /// Flight Computer - handles navigation calculations
   #[http_component]
   fn handle_flight_computer(req: Request) -> anyhow::Result<impl IntoResponse> {
       // Parse the incoming ISS coordinates from Mission Control
       let body = req.body();
       let iss_request: IssRequest = serde_json::from_slice(body)?;

       // Calculate distance from our fixed spaceship position to the ISS
       let distance = calculate_distance(
           SPACESHIP_LATITUDE,
           SPACESHIP_LONGITUDE,
           iss_request.iss.latitude,
           iss_request.iss.longitude,
       );

       // Calculate fuel required for the journey
       let fuel_required = distance * FUEL_RATE;

       // Prepare the mission report
       let report = MissionReport {
           distance_km: (distance * 10.0).round() / 10.0,
           fuel_required: (fuel_required * 10.0).round() / 10.0,
           status: "INTERCEPT COURSE READY".to_string(),
       };

       // Return the mission report as JSON
       Ok(Response::builder()
           .status(200)
           .header("content-type", "application/json")
           .body(serde_json::to_string(&report)?)
           .build())
   }

   /// Calculate distance using the Haversine formula
   fn calculate_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
       const EARTH_RADIUS_KM: f64 = 6371.0;

       let lat1_rad = lat1.to_radians();
       let lat2_rad = lat2.to_radians();
       let delta_lat = (lat2 - lat1).to_radians();
       let delta_lon = (lon2 - lon1).to_radians();

       let a = (delta_lat / 2.0).sin().powi(2)
           + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin().powi(2);
       let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());

       EARTH_RADIUS_KM * c
   }
   ```

#### Step 3: Configure Local Service Chaining

1. Open `spin.toml` and update the `allowed_outbound_hosts` line in the `[component.space-portal]` section to include permission to call our Flight Computer:

   ```toml
   allowed_outbound_hosts = ["http://api.open-notify.org:80", "http://flight-computer.spin.internal"]
   ```

2. The Flight Computer needs an HTTP trigger to be reachable via service chaining, but we'll mark it as **private** so it can only be called internally. Add this trigger configuration for the flight-computer in `spin.toml`:

   ```toml
   [[trigger.http]]
   route = { private = true }
   component = "flight-computer"
   ```

   The `route = { private = true }` setting means this component has no public HTTP route and is only accessible via service chaining from other components in the application.

#### Step 4: Update Mission Control to Call the Flight Computer

1. Go back to `src/index.ts` and update ROUTE 2 to integrate with the Flight Computer via Local Service Chaining:

   ```typescript
   // ROUTE 2: Plan Trip to ISS (with Flight Computer Integration)
   app.get("/plan-trip-to-iss", async (c) => {
     try {
       // Step 1: Fetch ISS position from external API
       const response = await fetch("http://api.open-notify.org/iss-now.json");
       const data = (await response.json()) as any;

       // Step 2: Call the Flight Computer via Local Service Chaining
       const flightComputerResponse = await fetch(
         "http://flight-computer.spin.internal",
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             iss: {
               latitude: parseFloat(data.iss_position.latitude),
               longitude: parseFloat(data.iss_position.longitude),
             },
           }),
         },
       );

       const missionReport = (await flightComputerResponse.json()) as any;

       // Step 3: Return comprehensive mission plan
       return c.json({
         status: "🚀 Mission Planning Complete",
         iss_location: data.iss_position,
         flight_computer_report: missionReport,
         message:
           "Flight Computer has calculated the optimal intercept course!",
       });
     } catch (error) {
       return c.text(`💥 Mission planning failed! Error: ${error}`, 500);
     }
   });
   ```

2. Save all your files.

### 🧠 Understanding Local Service Chaining

Notice the special URL: `http://flight-computer.spin.internal`

- **`flight-computer`** is the component ID defined in `spin.toml`
- **`.spin.internal`** is a special domain that tells Spin to route the request to another component in the same application
- The request **never leaves** the Spin runtime - it's passed directly in memory for maximum performance!
- The Flight Computer is **private** - it can only be called by other components, not from the internet

### 🎯 What We've Accomplished

✅ Built a **multi-component application** with TypeScript and Rust  
✅ Implemented **Local Service Chaining** for inter-component communication  
✅ Created clear **separation of concerns**: orchestration vs. computation  
✅ Demonstrated why Rust is great for precise calculations and type safety  
✅ Kept the Flight Computer private and secure

---

## 🚀 Phase 6: Mission Launch (Testing & Deploying)

Your cargo spaceship control system is fully assembled! Now it's time to test the systems locally and prepare for deployment to Akamai's global edge network.

### 📋 Participant Instructions:

1. In your terminal, run this command to build and compile both your TypeScript and Rust components into high-performance WebAssembly modules:
   ```bash
   spin build
   ```
   > **Note:** This will build both the TypeScript Mission Control and the Rust Flight Computer! You'll see Cargo compiling the Rust code and npm building the TypeScript code.
2. Once the build finishes cleanly, start your local test environment:
   ```bash
   spin up
   ```
3. Your terminal will print an address (usually `http://localhost:3000`). Open your internet browser and navigate to these endpoints to test your cargo spaceship systems:
   - `http://localhost:3000/` (Mission Control welcome message)
   - `http://localhost:3000/plan-trip-to-iss` (🚀 **NEW!** Full mission planning - tracks ISS, calculates intercept course and fuel requirements!)
   - `http://localhost:3000/load-cargo?item=Water-Recycler` (Load an item onto the spaceship)
   - `http://localhost:3000/check-vault` (View the complete cargo manifest)

   > **Watch the magic!** When you visit `/plan-trip-to-iss`, Mission Control fetches the real ISS position, then calls the Flight Computer via Local Service Chaining to calculate the intercept course - all happening in milliseconds!

4. **Deploy to Production:** When you're ready for a real supply mission, press `CTRL + C` to stop the local server, and deploy your cargo spaceship control system to Akamai's global edge network:
   ```bash
   spin aka deploy
   ```

---

## 🧑‍🏫 Instructor's Cheat Sheet (Solutions Guide)

If a student runs into a syntax error, structural bug, or misconfigures a setup path, use these exact complete file contents to get them back up and running instantly.

### `spin.toml` Complete Final Blueprint

```toml
spin_manifest_version = 2

[application]
name = "space-portal"
version = "0.1.0"
authors = ["Mission Specialist"]
description = "Cargo Spaceship Mission Control System for ISS supply runs"

[[trigger.http]]
route = "/..."
component = "space-portal"

[component.space-portal]
source = "dist/space-portal.wasm"
exclude_files = ["src/**/*.ts", "macro/**/*.ts", "node_modules/**"]
allowed_outbound_hosts = ["http://api.open-notify.org:80", "http://flight-computer.spin.internal"]
key_value_stores = ["default"]

[component.space-portal.build]
command = "npm run build"
watch = ["src/**/*.ts", "package.json"]

[[trigger.http]]
route = { private = true }
component = "flight-computer"

[component.flight-computer]
source = "flight-computer/target/wasm32-wasip1/release/flight_computer.wasm"
allowed_outbound_hosts = []

[component.flight-computer.build]
command = "cargo build --target wasm32-wasip1 --release"
workdir = "flight-computer"
watch = ["src/**/*.rs", "Cargo.toml"]
```

### `src/index.ts` Complete Final Code

```typescript
import { Hono } from "hono";
import * as Kv from "@spinframework/spin-kv";

const app = new Hono();

// ROUTE 1: Welcome Greeting
app.get("/", (c) => {
  return c.text(
    "� Cargo Spaceship Mission Control - Ready for ISS supply run!",
  );
});

// ROUTE 2: Plan Trip to ISS (with Flight Computer Integration)
app.get("/plan-trip-to-iss", async (c) => {
  try {
    // Step 1: Fetch ISS position from external API
    const response = await fetch("http://api.open-notify.org/iss-now.json");
    const data = (await response.json()) as any;

    // Step 2: Call the Flight Computer via Local Service Chaining
    const flightComputerResponse = await fetch(
      "http://flight-computer.spin.internal",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          iss: {
            latitude: parseFloat(data.iss_position.latitude),
            longitude: parseFloat(data.iss_position.longitude),
          },
        }),
      },
    );

    const missionReport = (await flightComputerResponse.json()) as any;

    // Step 3: Return comprehensive mission plan
    return c.json({
      status: "🚀 Mission Planning Complete",
      iss_location: data.iss_position,
      flight_computer_report: missionReport,
      message: "Flight Computer has calculated the optimal intercept course!",
    });
  } catch (error) {
    return c.text(`💥 Mission planning failed! Error: ${error}`, 500);
  }
});

// ROUTE 3: Saving Information to the Key-Value Vault
app.get("/load-cargo", (c) => {
  const cargoItem = c.req.query("item") || "Space Biscuits";
  const vault = Kv.openDefault();

  // Read existing cargo manifest (array of items)
  let existingManifest;
  try {
    existingManifest = vault.getJson("manifest");
    if (!existingManifest) {
      existingManifest = [];
    }
  } catch (e) {
    // Key doesn't exist or has invalid JSON, start fresh
    existingManifest = [];
  }

  // Add the new cargo item to the manifest
  existingManifest.push({
    item: cargoItem,
    timestamp: new Date().toISOString(),
  });

  // Save the updated manifest back to the vault
  vault.setJson("manifest", existingManifest);

  return c.text(
    `📦 Successfully locked [${cargoItem}] inside the ship's storage vault! Total items: ${existingManifest.length}`,
  );
});

// ROUTE 4: Reading Information from the Key-Value Vault
app.get("/check-vault", (c) => {
  const vault = Kv.openDefault();
  const currentCargo = vault.getJson("manifest");

  if (!currentCargo || currentCargo.length === 0) {
    return c.text("⚠️ Warning! No cargo loaded on the spaceship!");
  }

  return c.json({
    vault_status: "Secured",
    total_items: currentCargo.length,
    cargo_manifest: currentCargo,
  });
});

app.fire();
```

### `flight-computer/Cargo.toml` Complete Configuration

```toml
[package]
name = "flight-computer"
authors = ["Mission Specialist"]
description = "Flight Computer for ISS intercept calculations"
version = "0.1.0"
rust-version = "1.78"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
anyhow = "1"
spin-sdk = "5.0.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[workspace]
```

### `flight-computer/src/lib.rs` Complete Final Code

```rust
use spin_sdk::http::{IntoResponse, Request, Response};
use spin_sdk::http_component;
use serde::{Deserialize, Serialize};

// Fixed spaceship position (e.g., docked at Kennedy Space Center)
const SPACESHIP_LATITUDE: f64 = 28.5729;
const SPACESHIP_LONGITUDE: f64 = -80.6490;

// Simple fuel consumption rate (fuel units per km)
const FUEL_RATE: f64 = 0.42;

/// Request payload from Mission Control
#[derive(Deserialize)]
struct IssRequest {
    iss: Coordinates,
}

/// ISS coordinates
#[derive(Deserialize)]
struct Coordinates {
    latitude: f64,
    longitude: f64,
}

/// Mission report response
#[derive(Serialize)]
struct MissionReport {
    #[serde(rename = "distanceKm")]
    distance_km: f64,
    #[serde(rename = "fuelRequired")]
    fuel_required: f64,
    status: String,
}

/// Flight Computer - handles navigation calculations
#[http_component]
fn handle_flight_computer(req: Request) -> anyhow::Result<impl IntoResponse> {
    // Parse the incoming ISS coordinates from Mission Control
    let body = req.body();
    let iss_request: IssRequest = serde_json::from_slice(body)?;

    // Calculate distance from our fixed spaceship position to the ISS
    let distance = calculate_distance(
        SPACESHIP_LATITUDE,
        SPACESHIP_LONGITUDE,
        iss_request.iss.latitude,
        iss_request.iss.longitude,
    );

    // Calculate fuel required for the journey
    let fuel_required = distance * FUEL_RATE;

    // Prepare the mission report
    let report = MissionReport {
        distance_km: (distance * 10.0).round() / 10.0,
        fuel_required: (fuel_required * 10.0).round() / 10.0,
        status: "INTERCEPT COURSE READY".to_string(),
    };

    // Return the mission report as JSON
    Ok(Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&report)?)
        .build())
}

/// Calculate distance between two coordinates using the Haversine formula
fn calculate_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const EARTH_RADIUS_KM: f64 = 6371.0;

    // Convert degrees to radians
    let lat1_rad = lat1.to_radians();
    let lat2_rad = lat2.to_radians();
    let delta_lat = (lat2 - lat1).to_radians();
    let delta_lon = (lon2 - lon1).to_radians();

    // Haversine formula
    let a = (delta_lat / 2.0).sin().powi(2)
        + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());

    EARTH_RADIUS_KM * c
}
```

---

## 🔧 Troubleshooting Guide

### Issue: "Could not resolve 'hono'" or "Could not resolve '@spinframework/spin-kv'"

**Cause:** The required npm packages are not installed.

**Solution:** Run the following command in your project directory:

```bash
npm install hono @spinframework/spin-kv
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

### Issue: Rust build fails with "target not found" or "wasm32-wasip1 is not installed"

**Cause:** The WebAssembly target for Rust is not installed.

**Solution:** Add the WebAssembly compilation target:

```bash
rustup target add wasm32-wasip1
```

### Issue: "Service chaining failed" or "flight-computer not found"

**Cause:** The Flight Computer component may not have built correctly, or the permission is missing.

**Solution:**

1. Ensure `spin build` completed successfully for both components (check for Rust compilation output)
2. Verify `spin.toml` includes `"http://flight-computer.spin.internal"` in `allowed_outbound_hosts`
3. Make sure the component ID matches: `[component.flight-computer]` and the URL uses the same name

### Issue: "JSON parse error" in Flight Computer

**Cause:** The request format doesn't match what the Rust component expects.

**Solution:** Verify the TypeScript is sending the correct JSON structure:

```typescript
{
  iss: {
    latitude: parseFloat(data.iss_position.latitude),
    longitude: parseFloat(data.iss_position.longitude),
  }
}
```

### Issue: Rust component compiles but returns empty or wrong response

**Cause:** The `serde` or `serde_json` dependencies may be missing.

**Solution:** Check `flight-computer/Cargo.toml` includes:

```toml
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

---

## 🎓 Learning Outcomes Summary

Congratulations, Mission Specialist! By completing this lab, you have:

✅ Built a cargo spaceship control system that runs on the edge using WebAssembly  
✅ Created multiple HTTP routes using the Hono routing framework  
✅ Made external HTTP requests to track the ISS in real-time  
✅ Stored and retrieved persistent cargo manifest data using Key-Value storage  
✅ Learned how to configure security permissions for network access  
✅ **Built a multi-component application combining TypeScript and Rust**  
✅ **Implemented Local Service Chaining for inter-component communication**  
✅ **Separated concerns: Mission Control (orchestration) vs. Flight Computer (navigation)**  
✅ **Experienced why different languages excel at different tasks**  
✅ Deployed a polyglot application to Akamai's distributed edge network

You're now ready to build your own multi-language edge applications for real-world missions! 🚀
