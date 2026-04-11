const MS_PER_DAY = 24 * 60 * 60 * 1000
const EPOCH_DAY = Date.UTC(2026, 0, 1)

function localDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  }
}

function formatPadded(value: number) {
  return value.toString().padStart(2, '0')
}

export function getLocalPuzzleId(date = new Date()) {
  const { year, month, day } = localDateParts(date)
  return `${year}-${formatPadded(month + 1)}-${formatPadded(day)}`
}

export function getPuzzleNumber(date = new Date()) {
  const { year, month, day } = localDateParts(date)
  const localMidnight = Date.UTC(year, month, day)

  return Math.floor((localMidnight - EPOCH_DAY) / MS_PER_DAY) + 1
}

export function getDailyPuzzleContext(date = new Date()) {
  return {
    puzzleId: getLocalPuzzleId(date),
    puzzleNumber: getPuzzleNumber(date),
  }
}
