import { describe, expect, it } from "vitest";
import { generateICSContent } from "./ics";

const trip = { id: "trip-1", name: "Japan, 2026", location: "Tokyo; JP" };
const now = new Date("2026-01-02T03:04:05.000Z");
const base = {
  id: "a1",
  date: new Date(2026, 9, 1),
  title: "Museum",
  done: false,
};

const lines = (out: string) => out.split("\r\n");

describe("generateICSContent", () => {
  it("wraps events in a CRLF-joined VCALENDAR with an escaped calendar name", () => {
    const out = generateICSContent(trip, [], now);

    expect(out.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(out.endsWith("END:VCALENDAR")).toBe(true);
    expect(lines(out)).toContain("X-WR-CALNAME:Japan\\, 2026");
  });

  it("emits a floating timed event and defaults the end to one hour later", () => {
    const out = lines(generateICSContent(trip, [{ ...base, startTime: "09:30" }], now));

    expect(out).toContain("DTSTART:20261001T093000");
    expect(out).toContain("DTEND:20261001T103000");
    expect(out).toContain("DTSTAMP:20260102T030405Z");
    expect(out).toContain("UID:a1-trip-1@wanderly.app");
    expect(out).toContain("LOCATION:Tokyo\\; JP");
    expect(out).toContain("STATUS:CONFIRMED");
  });

  it("wraps the default end past midnight to 00:xx on the same date", () => {
    const out = lines(generateICSContent(trip, [{ ...base, startTime: "23:15" }], now));

    expect(out).toContain("DTEND:20261001T001500");
  });

  it("uses an explicit end time when provided", () => {
    const out = lines(
      generateICSContent(trip, [{ ...base, startTime: "09:00", endTime: "11:45" }], now),
    );

    expect(out).toContain("DTEND:20261001T114500");
  });

  it("emits an all-day event when there is no start time", () => {
    const out = lines(generateICSContent(trip, [{ ...base, date: new Date("2026-10-01T00:00:00Z") }], now));

    expect(out).toContain("DTSTART;VALUE=DATE:20261001");
    expect(out).toContain("DTEND;VALUE=DATE:20261001");
  });

  it("labels plane transport details as departure/arrival and marks done events cancelled", () => {
    const out = generateICSContent(
      trip,
      [
        {
          ...base,
          done: true,
          notes: "Bring passport",
          transportationMode: "plane",
          pickupTime: "07:00",
          pickupLocation: "MNL",
          dropoffLocation: "NRT",
        },
      ],
      now,
    );

    expect(out).toContain("STATUS:CANCELLED");
    expect(out).toContain(
      "DESCRIPTION:Bring passport\\n\\nTransportation Details: Transportation: Plane\\, Departure Time: 07:00\\, Departure Airport: MNL\\, Arrival Airport: NRT".replace(/\\,/g, ","),
    );
  });
});
