import { Hono } from "hono";
import * as Kv from "@spinframework/spin-kv";

const app = new Hono();

// ROUTE 1: Welcome Greeting
app.get("/", (c) => {
  return c.text("🛰️ Welcome to the Intergalactic Edge Space Station, Cadet!");
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
    return c.text("⚠️ Warning! The storage vault is completely empty!");
  }

  return c.json({
    vault_status: "Secured",
    total_items: currentCargo.length,
    cargo_manifest: currentCargo,
  });
});

app.fire();
