import { AnalysisStrategy } from "./customTypes/dataModel";

export class AnalysisContext {
  private strategy: AnalysisStrategy;

  constructor(strategy: AnalysisStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: AnalysisStrategy) {
    this.strategy = strategy;
  }

  executeStrategy(values: number[]): number | number[] {
    const result = this.strategy.calculate(values);

    // round to 2dp
    if (typeof result === "number") {
      return parseFloat(result.toFixed(2));
    } else {
      // if it is a number[]
      return result.map((num) => parseFloat(num.toFixed(2)));
    }
  }
}

export class SumStrategy implements AnalysisStrategy {
  public name: string = "sum";

  calculate(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0);
  }
}

export class MeanStrategy implements AnalysisStrategy {
  public name: string = "mean";

  calculate(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0) / values.length;
  }
}

class ModeStrategy implements AnalysisStrategy {
  public name: string = "mode";

  calculate(values: number[]): number[] {
    const frequencyMap: Record<number, number> = {};
    values.forEach((val) => {
      frequencyMap[val] = (frequencyMap[val] || 0) + 1;
    });
    const maxFrequency = Math.max(...Object.values(frequencyMap));
    return Object.keys(frequencyMap)
      .filter((key) => frequencyMap[Number(key)] === maxFrequency)
      .map(Number);
  }
}

class MinStrategy implements AnalysisStrategy {
  public name: string = "min";

  calculate(values: number[]): number {
    return Math.min(...values);
  }
}

class MaxStrategy implements AnalysisStrategy {
  public name: string = "max";

  calculate(values: number[]): number {
    return Math.max(...values);
  }
}

class MedianStrategy implements AnalysisStrategy {
  public name: string = "median";

  calculate(values: number[]): number {
    const sortedValues = values.slice().sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedValues.length / 2);
    if (sortedValues.length % 2 === 0) {
      return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
    } else {
      return sortedValues[middleIndex];
    }
  }
}

class VarianceStrategy implements AnalysisStrategy {
  public name: string = "variance";

  calculate(values: number[]): number {
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    return values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  }
}

class StandardDeviationStrategy implements AnalysisStrategy {
  public name: string = "standard_deviation";

  calculate(values: number[]): number {
    return Math.sqrt(new VarianceStrategy().calculate(values));
  }
}

/* possible strategies */
export const strategies: AnalysisStrategy[] = [
  new SumStrategy(),
  new MeanStrategy(),
  new ModeStrategy(),
  new MinStrategy(),
  new MaxStrategy(),
  new MedianStrategy(),
  new VarianceStrategy(),
  new StandardDeviationStrategy(),
];

/* helper method
 * @required param - aggregateArray: array of requested aggregates
 * @output - an array of requested strategies from the list above
 */
export function getSelectedStrategies(aggregateArray: string[]): AnalysisStrategy[] {
  return strategies.filter((s) => aggregateArray.includes(s.name));
}
