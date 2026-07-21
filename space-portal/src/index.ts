import { Hono } from "hono";
import * as Kv from "@spinframework/spin-kv";

const app = new Hono();

// ROUTE 1: The Space Station Docking Bay
app.get("/", (c) => {
  return c.text(
    "🛰️ Welcome to the Intergalactic Edge Space Station, Cadet!",
  );
});

// ROUTE 2: Plan Trip to ISS (with Flight Computer Integration)
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

// ROUTE 3: Load Cargo into the Vault
app.get("/load-cargo", (c) => {
  // Check the URL query parameter for an item name, or default to Space Biscuits
  const cargoItem = c.req.query("item") || "Space Biscuits";

  // Open the ship's secure vault
  const vault = Kv.openDefault();

  // Read existing cargo
  let cargo = vault.getJson("manifest");

  // Initialize as array if it doesn't exist or isn't an array
  if (!Array.isArray(cargo)) {
    cargo = [];
  }
  
  // Appen new item
  cargo.push({item: cargoItem, timestamp: new Date().toISOString()});

  // Write back
  vault.setJson("manifest", cargo);

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

app.fire();