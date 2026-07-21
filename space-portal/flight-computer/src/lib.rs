use spin_sdk::http::{IntoResponse, Request, Response};
use spin_sdk::http_component;
use serde::{Deserialize, Serialize};

// Fixed spaceship position (e.g., docked at a space station)
const SPACESHIP_LATITUDE: f64 = 28.5729; // Kennedy Space Center
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
        distance_km: (distance * 10.0).round() / 10.0, // Round to 1 decimal place
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
/// This is a simplified version for demonstration purposes
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