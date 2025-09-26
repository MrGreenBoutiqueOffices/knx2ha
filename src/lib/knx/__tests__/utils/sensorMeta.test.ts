import { describe, expect, it } from "@jest/globals";

import { SENSOR_META } from "@/lib/knx/sensorMeta";

describe("sensorMeta", () => {
  it("provides units for known sensor types", () => {
    expect(SENSOR_META.temperature?.unit).toBe("°C");
    expect(SENSOR_META.humidity?.unit).toBe("%");
    expect(SENSOR_META.voltage?.unit).toBe("V");
    expect(SENSOR_META.volume_flow?.unit).toBe("m³/h");
  });

  it("exposes lucide icons for key sensor types", () => {
    const temperatureIcon = SENSOR_META.temperature?.Icon;
    const voltageIcon = SENSOR_META.voltage?.Icon;

    expect(temperatureIcon).toBeDefined();
    expect(voltageIcon).toBeDefined();

    expect(temperatureIcon && typeof temperatureIcon).toBe("object");
    expect(voltageIcon && typeof voltageIcon).toBe("object");
  });

  it("reuses icons for related sensor types", () => {
    expect(SENSOR_META.wind_speed_ms?.Icon).toBe(SENSOR_META.wind_speed_kmh?.Icon);
    expect(SENSOR_META.rain_amount?.Icon).toBe(SENSOR_META.volume_flow?.Icon);
  });
});
