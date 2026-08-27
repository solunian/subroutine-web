export const to_24hrtime_str = (t: Date) =>
  `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

export const to_date_str = (t: Date) =>
  `${t.getFullYear()}-${(t.getMonth() + 1).toString().padStart(2, "0")}-${t.getDate().toString().padStart(2, "0")}`;

export const to_duration_str = (ms: number) => {
  const total_sec = Math.ceil(ms / 1000);
  const hr = Math.floor(total_sec / 3600);
  const min = Math.floor(total_sec / 60) % 60;
  const sec = total_sec % 60;

  return `${hr.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

export const to_fulltime_str = (t: Date) => `${to_date_str(t)} ${to_24hrtime_str(t)}`;

export const get_n_days_date = (date: Date, n: number) =>
  new Date(date.getTime() + n * 24 * 60 * 60 * 1000);

export const get_day_start = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const get_next_day = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

// prevents 0 values if non-zero but would round down to 0.
export const round_to_fixed = (x: number, decimals: number) => {
  const shifts = Math.pow(10, decimals);
  const rounded = Math.round(x * shifts) / shifts;

  if (rounded === 0 && x > 0) {
    // prevent 0.0 for positive values that round down to zero
    return (Math.sign(x) / shifts).toFixed(decimals);
  } else {
    return rounded.toFixed(decimals);
  }
};

export const from_now = (now: Date, date_input: Date) => {
  const date = new Date(date_input);
  const seconds_diff = Math.round((date.getTime() - now.getTime()) / 1000);

  // Define time intervals in seconds
  const units: { max: number; value: number; name: Intl.RelativeTimeFormatUnit }[] = [
    { max: 60, value: 1, name: "second" },
    { max: 3600, value: 60, name: "minute" },
    { max: 86400, value: 3600, name: "hour" },
    { max: 2592000, value: 86400, name: "day" },
    { max: 31536000, value: 2592000, name: "month" },
    { max: Infinity, value: 31536000, name: "year" },
  ];

  // Initialize the native relative time formatter
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" });

  for (const unit of units) {
    if (Math.abs(seconds_diff) < unit.max) {
      const count = Math.round(seconds_diff / unit.value);
      return rtf.format(count, unit.name).toLowerCase();
    }
  }
};

export const diff_days = (date1: Date, date2: Date) =>
  Math.ceil(Math.abs(date2.getTime() - date1.getTime()) / 86400000);
