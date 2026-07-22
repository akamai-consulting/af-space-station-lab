# 🧑‍🏫 Instructor's Cheat Sheet (Solutions Guide)

If a student runs into a syntax error, structural bug, or misconfigures a setup path, use these exact complete file contents to get them back up and running instantly.

### `spin.toml` Complete Final Blueprint

```toml
spin_manifest_version = 2

[application]
authors = ["Pedro Costa <pcosta@akamai.com>"]
description = "Testing the Lab"
name = "space-portal"
version = "0.1.0"

[[trigger.http]]
route = "/..."
component = "space-portal"


[component.space-portal]
source = "dist/space-portal.wasm"
exclude_files = ["**/node_modules"]
allowed_outbound_hosts = [
    # "tcp://127.0.0.1:*", # Uncomment this line to while using the StarlingMonkey Debugger
    "http://api.open-notify.org:80",
    "http://flight-computer.spin.internal"
]
key_value_stores = ["default"]
[component.space-portal.build]
command = ["npm install", "npm run build"]
watch = ["src/**/*.ts"]

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

### `cargo.toml` Complete Final Blueprint

```toml
[package]
name = "flight-computer"
authors = ["Pedro Costa <pcosta@akamai.com>"]
description = ""
version = "0.1.0"
rust-version = "1.78"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
anyhow = "1"
spin-sdk = "5.2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[workspace]
```

### `src/index.ts` Complete Final Code

```typescript
import { Hono } from "hono";
import * as Kv from "@spinframework/spin-kv";

const app = new Hono();

// ROUTE 1: The Space Station Docking Bay
app.get("/", (c) => {
  return c.text(
    "🛰️ Welcome to the Intergalactic Edge Space Station, Cadet!",
  );
});

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

// ROUTE 3: Load Cargo into the Vault

app.get("/load-cargo", (c) => {
  // Check the URL query parameter for an item name, or default to Space Biscuits
  const cargoItem = c.req.query("item") || "Space Biscuits";

  // Open the ship's secure vault
  const vault = Kv.openDefault();

  try {
    // Read existing cargo
    let cargo = vault.getJson("manifest");

    // Initialize as array if it doesn't exist or isn't an array
    if (!Array.isArray(cargo)) {
      cargo = [];
    }

    // Append new item
    cargo.push({ item: cargoItem, timestamp: new Date().toISOString() });

    // Write back
    vault.setJson("manifest", cargo);
  } catch (error) {
    // Key doesn't exist yet, create new array
    vault.setJson("manifest", [{ item: cargoItem, timestamp: new Date().toISOString() }]);
  }

  return c.text(
    `📦 Successfully locked [${cargoItem}] inside the ship's storage vault!`,
  );
});

// ROUTE 4: Inspect the Vault
app.get("/check-vault", (c) => {
  const vault = Kv.openDefault();

  try {
    // Pull the item data back out of the vault
    const currentCargo = vault.getJson("manifest");

    if (!currentCargo) {
      return c.text("⚠️ Warning! The storage vault is completely empty!");
    }

    return c.json({
      vault_status: "Secured",
      current_inventory: currentCargo,
    });
  } catch (error) {
    // Key doesn't exist yet
    return c.text("⚠️ Warning! The storage vault is completely empty!");
  }
});

// ROUTE 5: Plan Trip to ISS (with Flight Computer Integration)
app.get("/plan-trip-to-iss", async (c) => {
  try {
    const response = await fetch("http://api.open-notify.org/iss-now.json");
    const data = (await response.json()) as any;

    const flightComputerResponse = await fetch(
      "http://flight-computer.spin.internal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iss: {
            latitude: parseFloat(data.iss_position.latitude),
            longitude: parseFloat(data.iss_position.longitude),
          },
        }),
      },
    );

    // Check if response is ok
    if (!flightComputerResponse.ok) {
      return c.text(`⚠️ Flight Computer error: ${flightComputerResponse.status}`, 500);
    }

    // Check if response has content
    const responseText = await flightComputerResponse.text();
    if (!responseText) {
      return c.text("⚠️ Flight Computer returned empty response", 500);
    }

    const missionReport = JSON.parse(responseText);

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

app.fire();
```

### `lib.rs` Complete Final Blueprint

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

### `package.json` Complete Final Blueprint

```json
{
  "name": "space-portal",
  "version": "1.0.0",
  "description": "Testing the Lab",
  "main": "index.js",
  "scripts": {
    "build": "node build.mjs && mkdirp dist && j2w -i build/bundle.js --initLocation http://space-portal.localhost -o dist/space-portal.wasm",
    "build:debug": "node build.mjs && mkdirp dist && j2w -d -i build/bundle.js --initLocation http://space-portal.localhost -o dist/space-portal.wasm",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "esbuild": "^0.25.8",
    "mkdirp": "^3.0.1",
    "ts-loader": "^9.4.1",
    "typescript": "^4.8.4"
  },
  "dependencies": {
    "@spinframework/build-tools": "^1.0.4",
    "@spinframework/spin-kv": "^1.0.1",
    "@spinframework/wasi-http-proxy": "^1.0.0",
    "hono": "^4.7.4"
  }
}
```
