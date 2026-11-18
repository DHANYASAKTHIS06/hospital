export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const DAYS_OF_WEEK_TA: Record<string, string> = {
  Sunday: 'ஞாயிற்றுக்கிழமை',
  Monday: 'திங்கட்கிழமை',
  Tuesday: 'செவ்வாய்க்கிழமை',
  Wednesday: 'புதன்கிழமை',
  Thursday: 'வியாழக்கிழமை',
  Friday: 'வெள்ளிக்கிழமை',
  Saturday: 'சனிக்கிழமை',
};

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_NAMES_TA = [
  'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
  'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்',
];

export interface KolkataDatesFrontend {
  todayDateObj: Date;
  tomorrowDateObj: Date;
  currentDay: string;
  tomorrowDay: string;
  tomorrowDayTa: string;
  orderPlacedDate: string;
  deliveryDate: string;
  formattedTomorrowEn: string;
  formattedTomorrowTa: string;
}

export const getKolkataDatesFrontend = (referenceDate: Date = new Date()): KolkataDatesFrontend => {
  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const parts = partsFormatter.formatToParts(referenceDate);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10) - 1;
  const day = parseInt(partMap.day, 10);

  const todayDateObj = new Date(Date.UTC(year, month, day));
  const tomorrowDateObj = new Date(Date.UTC(year, month, day + 1));

  const currentDay = DAYS_OF_WEEK[todayDateObj.getUTCDay()];
  const tomorrowDay = DAYS_OF_WEEK[tomorrowDateObj.getUTCDay()];
  const tomorrowDayTa = DAYS_OF_WEEK_TA[tomorrowDay] || tomorrowDay;

  const pad = (n: number) => String(n).padStart(2, '0');
  const orderPlacedDate = `${pad(todayDateObj.getUTCDate())}/${pad(todayDateObj.getUTCMonth() + 1)}/${todayDateObj.getUTCFullYear()}`;
  const deliveryDate = `${pad(tomorrowDateObj.getUTCDate())}/${pad(tomorrowDateObj.getUTCMonth() + 1)}/${tomorrowDateObj.getUTCFullYear()}`;

  const tomorrowDayNum = tomorrowDateObj.getUTCDate();
  const tomorrowMonthIdx = tomorrowDateObj.getUTCMonth();
  const tomorrowYear = tomorrowDateObj.getUTCFullYear();

  const formattedTomorrowEn = `${tomorrowDay}, ${tomorrowDayNum} ${MONTH_NAMES_EN[tomorrowMonthIdx]} ${tomorrowYear}`;
  const formattedTomorrowTa = `${tomorrowDayTa}, ${tomorrowDayNum} ${MONTH_NAMES_TA[tomorrowMonthIdx]} ${tomorrowYear}`;

  return {
    todayDateObj,
    tomorrowDateObj,
    currentDay,
    tomorrowDay,
    tomorrowDayTa,
    orderPlacedDate,
    deliveryDate,
    formattedTomorrowEn,
    formattedTomorrowTa,
  };
};
