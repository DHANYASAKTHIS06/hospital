export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export interface KolkataDates {
  todayDateObj: Date;
  tomorrowDateObj: Date;
  currentDay: string;
  tomorrowDay: string;
  orderPlacedDate: string;
  deliveryDate: string;
  orderTime: string;
  formattedTomorrow: string;
}

export const getKolkataDates = (referenceDate: Date = new Date()): KolkataDates => {
  // Format reference timestamp in Asia/Kolkata
  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  });

  const parts = partsFormatter.formatToParts(referenceDate);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10) - 1; // 0-indexed
  const day = parseInt(partMap.day, 10);

  // Use UTC representation so daylight savings or host timezone never alters day boundary
  const todayDateObj = new Date(Date.UTC(year, month, day));
  const tomorrowDateObj = new Date(Date.UTC(year, month, day + 1));

  const currentDay = DAYS_OF_WEEK[todayDateObj.getUTCDay()];
  const tomorrowDay = DAYS_OF_WEEK[tomorrowDateObj.getUTCDay()];

  const pad = (n: number) => String(n).padStart(2, '0');
  const orderPlacedDate = `${pad(todayDateObj.getUTCDate())}/${pad(todayDateObj.getUTCMonth() + 1)}/${todayDateObj.getUTCFullYear()}`;
  const deliveryDate = `${pad(tomorrowDateObj.getUTCDate())}/${pad(tomorrowDateObj.getUTCMonth() + 1)}/${tomorrowDateObj.getUTCFullYear()}`;

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const orderTime = timeFormatter.format(referenceDate);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const formattedTomorrow = `${tomorrowDay}, ${tomorrowDateObj.getUTCDate()} ${monthNames[tomorrowDateObj.getUTCMonth()]} ${tomorrowDateObj.getUTCFullYear()}`;

  return {
    todayDateObj,
    tomorrowDateObj,
    currentDay,
    tomorrowDay,
    orderPlacedDate,
    deliveryDate,
    orderTime,
    formattedTomorrow,
  };
};
