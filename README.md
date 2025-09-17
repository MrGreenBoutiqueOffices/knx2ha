# KNX2HA Parser

This project is a **Next.js application** that converts KNX configuration files into **Home Assistant compatible YAML configuration**.  
It automatically detects entities (lights, switches, covers, sensors, …) and annotates them for direct use in Home Assistant.

## Key Features

- 🔍 **KNX Group Address Parsing**  
  Converts KNX addresses and DPTs into Home Assistant entities.
- ⚡ **Smart Heuristics**  
  Automatically guesses the correct entity type (light, switch, cover, sensor, …).
- 📝 **YAML Generator**  
  Produces valid Home Assistant configurations (`configuration.yaml` or packages).
- 🗂 **Aggregate View**  
  Combines related entities into logical sets (e.g., covers with state and position).
- 🌍 **Next.js Frontend**  
  Web interface for uploading, previewing, and exporting configurations.

## Getting Started

To run this project locally, follow these steps:

### 1. Requirements

At least the following software should be installed:

- Node.js 20+
- npm

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm start
```

## Resources

- [KNX Association](https://www.knx.org/)
- [Home Assistant KNX Integration](https://www.home-assistant.io/integrations/knx/)
- [Next.js Documentation](https://nextjs.org/docs)
