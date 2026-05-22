export function isE164PhoneNumber(phoneNumber) {
    return typeof phoneNumber === "string" && /^\+[1-9]\d{7,14}$/.test(phoneNumber);
}

export function parseAllowedTestNumbers(value) {
    if (!value || typeof value !== "string") {
        return [];
    }

    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
