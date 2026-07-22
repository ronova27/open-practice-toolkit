export const TRANSPORT_DEFAULTS = Object.freeze({
  lookaheadSeconds: 0.25,
  schedulerIntervalMs: 50,
  maxEventsPerWindow: 256
});

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function planTransportWindow({
  events = [],
  cycleDuration,
  startTime = 0,
  horizonTime = 0,
  minimumTime = 0,
  nextEventIndex = 0,
  cycleIndex = 0,
  maxEvents = TRANSPORT_DEFAULTS.maxEventsPerWindow
} = {}) {
  if (!Array.isArray(events) || !events.length) {
    return { scheduled: [], nextEventIndex: 0, cycleIndex: 0 };
  }

  const duration = finiteNumber(cycleDuration, 0);
  if (duration <= 0) {
    return { scheduled: [], nextEventIndex: 0, cycleIndex: 0 };
  }

  let eventIndex = Math.max(0, Math.floor(finiteNumber(nextEventIndex, 0))) % events.length;
  let currentCycle = Math.max(0, Math.floor(finiteNumber(cycleIndex, 0)));
  const firstTime = finiteNumber(startTime, 0);
  const horizon = finiteNumber(horizonTime, firstTime);
  const minimum = finiteNumber(minimumTime, firstTime);
  const limit = Math.max(1, Math.floor(finiteNumber(maxEvents, TRANSPORT_DEFAULTS.maxEventsPerWindow)));
  const scheduled = [];

  while (scheduled.length < limit) {
    const event = events[eventIndex];
    const relativeTime = Math.max(0, finiteNumber(event.time, 0));
    const time = firstTime + currentCycle * duration + relativeTime;
    if (time > horizon) break;

    if (time >= minimum) scheduled.push({ event, time, cycleIndex: currentCycle });

    eventIndex += 1;
    if (eventIndex >= events.length) {
      eventIndex = 0;
      currentCycle += 1;
    }
  }

  return {
    scheduled,
    nextEventIndex: eventIndex,
    cycleIndex: currentCycle
  };
}
