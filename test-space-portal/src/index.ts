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

app.fire();