import dotenv from "dotenv";
import { S3Service } from "./S3Service";
import { ErrorWithStatus } from "./types/errorWithStatus";
import { DEFAULT_LOCATION_BIAS, DEFAULT_LOCATION_RADIUS_BIAS } from "./constants";

dotenv.config();

const ROOT_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";
const SUBURB_REGEX = /^(.*?)\s+NSW/;

/**
 * Retrieves a list of suburbs based on the provided address using Google Places API.
 * @param {string} address - The address for which to retrieve suburbs.
 * @returns {Promise<string[]>} A promise that resolves to an array of suburbs.
 */
export async function getSuburbs(address: string): Promise<string[]> {
  const params = {
    input: address,
    inputtype: "textquery",
    fields: "formatted_address",
    key: process.env.GOOGLE_API_KEY as string,
    locationbias: `circle:${DEFAULT_LOCATION_RADIUS_BIAS}@${DEFAULT_LOCATION_BIAS}`,
  };

  const res = await fetch(`${ROOT_URL}?${new URLSearchParams({ ...params }).toString()}`);
  const resObj = await res.json();

  if (!resObj.candidates || resObj.candidates.length === 0) {
    throw new ErrorWithStatus(`Recevied no results for address ${address}`, 404);
  }

  const candidates = resObj.candidates;
  const returnArr: string[] = [];
  for (const candidate of candidates) {
    const locality = (candidate["formatted_address"] as string).split(",")[1];
    const match = SUBURB_REGEX.exec(locality);
    if (match) {
      returnArr.push(match[1].trim());
    }
  }
  return returnArr;
}

/**
 * Filters the provided list of suburbs to include only those within Sydney region.
 * @param {string[]} suburbs - The list of suburbs to filter.
 * @returns {Promise<string[]>} A promise that resolves to an array of Sydney suburbs.
 */
export async function getSydneySuburbs(suburbs: string[]): Promise<string[]> {
  const filePath = "SE3011-24-F14A-03/suburbsData/sydney_suburbs.json";
  const data = await new S3Service().readBucket(filePath);
  const validSuburbs: string[] = [];
  for (const entry of data) {
    validSuburbs.push(entry.suburb.toLowerCase());
  }
  return suburbs.filter((suburb) => validSuburbs.includes(suburb.toLowerCase())).sort();
}
