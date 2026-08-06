// Timestamp-based id generator
let lastTimestamp = 0;
let sequence = 0;

export function generateId() {
    const now = Date.now();
    if (now > lastTimestamp) {
        lastTimestamp = now;
        sequence = 0;
    } else {
        sequence = (sequence + 1) % 1000;
    }
    return lastTimestamp * 1000 + sequence;
}
