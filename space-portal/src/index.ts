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

app.fire();