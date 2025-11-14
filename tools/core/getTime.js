/**
 * Gets the current time in ISO format.
 * @returns {Promise<Object>} Result object.
 * @example
 * getTime().then(result => console.log(result)); // { "time": "2023-10-01T12:00:00.000Z" }
 */
export default async function getTime() {
    return { time: new Date().toISOString() };
}