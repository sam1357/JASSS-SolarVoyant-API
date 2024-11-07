import { getDate, isValidSuburb } from "../src/utils"


describe("Suburb Verifier", () => {

  it("Valid suburbs", async () => {
    expect(await isValidSuburb("Panania")).toBe(true);
    expect(await isValidSuburb("PANANIA")).toBe(true);
    expect(await isValidSuburb("PaNaNIa")).toBe(true);
    expect(await isValidSuburb("Bass hill")).toBe(true);
  }, 10 * 1000);

  it("Invalid suburbs", async () => {
    expect(await isValidSuburb("A")).toBe(false);
    expect(await isValidSuburb("London")).toBe(false);
  }, 10 * 1000);

});

describe("getDate", () => {

  it("Current Day", async () => {
    // Test current day
    let yourDate: Date = new Date();
    const offset: number = yourDate.getTimezoneOffset();
    yourDate = new Date(yourDate.getTime() - offset * 60 * 1000);
    yourDate.setDate(yourDate.getDate());
    const expectedDate = yourDate.toISOString().split("T")[0];
    const realDate = getDate(0);
    expect(realDate).toBe(expectedDate);
  });

  it("Current Future Day", async () => {
    let yourDate: Date = new Date();
    const offset: number = yourDate.getTimezoneOffset();
    yourDate = new Date(yourDate.getTime() - offset * 60 * 1000);
    yourDate.setDate(yourDate.getDate() + 1);
    const expectedDate = yourDate.toISOString().split("T")[0];
    const realDate = getDate(1);
    expect(realDate).toBe(expectedDate);
  });


});