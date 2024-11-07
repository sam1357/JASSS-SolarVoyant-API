import {
  calculateProdCoefficientVals,
  calculateProdCoefficients,
  containsData,
  handleCoefficientCalculation,
} from "@src/utils";

describe("Test coefficient", () => {
  it("Coefficient calculator", async () => {
    const user = {
      q1_w: "1000",
      q2_w: "2000",
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_d: "50555.78",
      q2_d: "40677.27",
      q3_d: "37056.407",
      q4_d: "46031.35",
    };
    const response = await handleCoefficientCalculation(user);
    expect(response).toStrictEqual(["242.47594890651987", "-0.13159545276933304"]);
  });
});

describe("Test prod coefficient", () => {
  it("Prod  calculator", async () => {
    const user = {
      q1_w: "1000",
      q2_w: "2000",
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_r: "50555.78",
      q2_r: "40677.27",
      q3_r: "37056.407",
      q4_r: "46031.35",
    };
    const response = await calculateProdCoefficientVals(user, 10);
    expect(response).toStrictEqual([505.5578, 203.38634999999996, 185.282035, 30.687566666666665]);
  });
});

describe("Test contains data consumption", () => {
  it("Test #1", async () => {
    const user = {
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_d: "50555.78",
      q2_d: "40677.27",
      q3_d: "37056.407",
      q4_d: "46031.35",
    };
    expect(containsData(user)).toBe(false);
  });

  it("Test #2", async () => {
    const user = {
      q1_w: "1000",
      q2_w: "2000",
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_d: "50555.78",
      q2_d: "40677.27",
      q3_d: "37056.407",
      q4_d: "46031.35",
    };
    expect(containsData(user)).toBe(true);
  });

  it("Test #3", async () => {
    const user = {};
    expect(containsData(user)).toBe(false);
  });
});

describe("Test contains data production", () => {
  it("Test #1", async () => {
    const user = {
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_d: "50555.78",
      q2_d: "40677.27",
      q3_d: "37056.407",
      q4_d: "46031.35",
    };
    expect(calculateProdCoefficients(user)).toBe(false);
  });

  it("Test #2", async () => {
    const user = {
      q1_w: "1000",
      q2_w: "2000",
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_r: "50555.78",
      q2_r: "40677.27",
      q3_r: "37056.407",
      q4_r: "46031.35",
      production_coefficient: ["1", "2", "3", "4"],
    };
    expect(calculateProdCoefficients(user)).toBe(false);
  });

  it("Test #2", async () => {
    const user = {
      q1_w: "1000",
      q2_w: "2000",
      q3_w: "2000",
      q4_w: "1500",
      q1_t: "22.06",
      q2_t: "16.69",
      q3_t: "11.73",
      q4_t: "17.75",
      q1_r: "50555.78",
      q2_r: "40677.27",
      q3_r: "37056.407",
      q4_r: "46031.35",
      production_coefficient: [],
    };
    expect(calculateProdCoefficients(user)).toBe(true);
  });

  it("Test #3", async () => {
    const user = {};
    expect(calculateProdCoefficients(user)).toBe(false);
  });
});
