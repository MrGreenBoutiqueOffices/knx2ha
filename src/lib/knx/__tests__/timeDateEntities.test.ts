import assert from "node:assert/strict";
import { test } from "node:test";
import YAML from "yaml";

import { buildHaEntities, haEntitiesToYaml } from "@/lib/knx/export";
import type { KnxCatalog } from "@/lib/types";

test("maps DPT 10/11/19 to dedicated time domains", () => {
  const catalog: KnxCatalog = {
    project_name: "Fixture",
    group_addresses: [
      {
        id: "ga-1",
        name: "Central Time",
        address: "1/0/1",
        dpt: "10.001",
      },
      {
        id: "ga-2",
        name: "Central Date",
        address: "1/0/2",
        dpt: "11.001",
      },
      {
        id: "ga-3",
        name: "Central DateTime",
        address: "1/0/3",
        dpt: "19.001",
      },
      {
        id: "ga-4",
        name: "Outdoor Temperature",
        address: "2/0/1",
        dpt: "9.001",
      },
      {
        id: "ga-5",
        name: "General - Zone klep 1 t/m 8 aan/uit",
        address: "3/0/0",
        dpt: "10.001",
      },
    ],
  };

  const entities = buildHaEntities(catalog);

  assert.equal(entities.times.length, 1);
  assert.deepEqual(entities.times[0], {
    name: "Central Time",
    address: "1/0/1",
    state_address: "1/0/1",
  });

  assert.equal(entities.dates.length, 1);
  assert.deepEqual(entities.dates[0], {
    name: "Central Date",
    address: "1/0/2",
    state_address: "1/0/2",
  });

  assert.equal(entities.datetimes.length, 1);
  assert.deepEqual(entities.datetimes[0], {
    name: "Central DateTime",
    address: "1/0/3",
    state_address: "1/0/3",
  });

  assert.equal(entities.sensors.length, 1);
  assert.equal(entities.sensors[0]?.state_address, "2/0/1");

  assert.equal(entities.switches.length, 1);
  assert.deepEqual(entities.switches[0], {
    name: "General - Zone klep 1 t/m 8 aan/uit",
    address: "3/0/0",
  });

  const yaml = haEntitiesToYaml(entities);
  const parsed = YAML.parse(yaml) as {
    knx: Record<string, Array<Record<string, unknown>>>;
  };

  const timeSection = parsed.knx?.time ?? [];
  const dateSection = parsed.knx?.date ?? [];
  const datetimeSection = parsed.knx?.datetime ?? [];
  const sensorSection = parsed.knx?.sensor ?? [];
  const switchSection = parsed.knx?.switch ?? [];

  const stateAddresses = (entries: Array<Record<string, unknown>>) =>
    entries
      .map((entry) =>
        typeof entry.state_address === "string" ? entry.state_address : undefined
      )
      .filter((addr): addr is string => Boolean(addr));

  const switchAddresses = switchSection
    .map((entry) =>
      typeof entry.address === "string" ? entry.address : undefined
    )
    .filter((addr): addr is string => Boolean(addr));

  assert.deepEqual(stateAddresses(timeSection), ["1/0/1"]);
  assert.deepEqual(stateAddresses(dateSection), ["1/0/2"]);
  assert.deepEqual(stateAddresses(datetimeSection), ["1/0/3"]);

  const sensorAddresses = stateAddresses(sensorSection);
  assert.ok(!sensorAddresses.includes("1/0/1"));
  assert.ok(!sensorAddresses.includes("1/0/2"));
  assert.ok(!sensorAddresses.includes("1/0/3"));
  assert.ok(!stateAddresses(timeSection).includes("3/0/0"));
  assert.ok(switchAddresses.includes("3/0/0"));
});
