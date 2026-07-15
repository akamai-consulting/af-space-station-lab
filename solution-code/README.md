# 🚀 Space Portal - Multi-Component Spin Application

A demonstration of **Local Service Chaining** in Spin, featuring a multi-component architecture with TypeScript and Rust working together.

## 🏗️ Architecture Overview

This application consists of two components:

### 1. **Mission Control** (TypeScript)

- **Language**: TypeScript with Hono framework
- **Responsibilities**:
  - Handle HTTP requests from users
  - Fetch ISS position from external API
  - Orchestrate the workflow
  - Interact with Key-Value storage
  - Call the Flight Computer via Local Service Chaining

### 2. **Flight Computer** (Rust)

- **Language**: Rust
- **Responsibilities**:
  - Perform distance calculations (Haversine formula)
  - Calculate fuel requirements
  - Maintain spaceship home position (Kennedy Space Center)
  - Return mission reports
  - **Not publicly accessible** - only callable via service chaining

## 🔗 Local Service Chaining

The TypeScript component communicates with the Rust component using Spin's Local Service Chaining feature:

```typescript
// Mission Control calls Flight Computer
const response = await fetch("http://flight-computer.spin.internal", {
  method: "POST",
  body: JSON.stringify({
    iss: { latitude: 51.2, longitude: -8.4 },
  }),
});
```

### Key Benefits:

- ✅ **In-memory communication** - no network overhead
- ✅ **Private components** - Flight Computer not exposed publicly
- ✅ **Type-safe** - Rust provides strong guarantees
- ✅ **Separation of concerns** - orchestration vs. computation

## 🛠️ Getting Started

### Prerequisites

- [Spin CLI](https://developer.fermyon.com/spin/install) installed
- Node.js and npm installed
- Rust with `wasm32-wasip1` target:
  ```bash
  rustup target add wasm32-wasip1
  ```

### Build the Application

```bash
spin build
```

This builds both components:

1. TypeScript → WebAssembly (via js2wasm)
2. Rust → WebAssembly (via cargo)

### Run Locally

```bash
spin up
```

### Test the Routes

- **Welcome**: `http://localhost:3000/`
- **🚀 Plan Trip to ISS**: `http://localhost:3000/plan-trip-to-iss`
  - Fetches ISS location
  - Calculates distance and fuel via Flight Computer
- **Load Cargo**: `http://localhost:3000/load-cargo?item=Quantum-Fuel`
- **Check Vault**: `http://localhost:3000/check-vault`

## 📦 Project Structure

```
solution-code/
├── src/
│   └── index.ts              # Mission Control (TypeScript)
├── flight-computer/
│   ├── src/
│   │   └── lib.rs            # Flight Computer (Rust)
│   └── Cargo.toml
├── spin.toml                 # Application manifest
└── package.json
```

## 🔐 Security Configuration

In `spin.toml`, note the `allowed_outbound_hosts`:

```toml
[component.space-portal]
allowed_outbound_hosts = [
  "http://api.open-notify.org:80",           # External API
  "http://flight-computer.spin.internal"     # Service chaining
]
```

## 🎯 Why This Architecture?

### TypeScript (Mission Control)

- **Best for**: HTTP handling, API orchestration, JSON manipulation
- **Benefits**: Familiar syntax, great for web workflows
- **Use case**: Managing incoming requests and coordinating services

### Rust (Flight Computer)

- **Best for**: Precise calculations, type safety, performance
- **Benefits**: No runtime errors, memory safety, speed
- **Use case**: Mission-critical computations and business logic

## 🎓 Workshop Learning Goals

1. **Multi-component applications** - Different languages for different tasks
2. **Local Service Chaining** - High-performance inter-component communication
3. **Private components** - Not all components need public routes
4. **Separation of concerns** - Orchestration (TS) vs. Computation (Rust)
5. **WebAssembly strengths** - Polyglot applications in a secure sandbox

## 📚 Additional Resources

- [Spin Documentation](https://developer.fermyon.com/spin)
- [Local Service Chaining](https://spinframework.dev/v3/http-outbound#local-service-chaining)
- [Lab Guide](../instructions/lab-guide-space-portal.md)

## 🚀 Deploy to Akamai Functions

```bash
spin aka deploy
```

Your multi-component application will run globally at the edge!
