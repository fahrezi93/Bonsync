export function getJakartaDateParts() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parseInt(parts.find(p => p.type === "year")!.value, 10);
  const month = parseInt(parts.find(p => p.type === "month")!.value, 10) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === "day")!.value, 10);
  return { year, month, day };
}

export function getJakartaMonthStart() {
  const { year, month } = getJakartaDateParts();
  // Asia/Jakarta is UTC+7. 
  // 00:00:00 Jakarta time is 17:00:00 UTC the previous day.
  return new Date(Date.UTC(year, month, 1, -7, 0, 0, 0));
}

export const monthFormatter = new Intl.DateTimeFormat("id-ID", { 
  month: "2-digit", 
  year: "numeric", 
  timeZone: "Asia/Jakarta" 
});

export const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", { 
  month: "long", 
  year: "numeric", 
  timeZone: "Asia/Jakarta" 
});

export const shortDateFormatter = new Intl.DateTimeFormat("id-ID", { 
  dateStyle: "short", 
  timeZone: "Asia/Jakarta" 
});
