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
    return c.text(
      `💥 Space debris blocked our probe! Try again later. ${error}`,
      500,
    );
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
