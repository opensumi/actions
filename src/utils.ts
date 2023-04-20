export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function getTimeStampByDate(t: Date | number | string): number {
  const d = new Date(t);

  return d.getTime();
}

export function getDateString(
  t: Date | number | string,
  format = 'yyyy/MM/dd'
): string {
  const d = new Date(getTimeStampByDate(t));

  const yyyy = d.getFullYear();
  const MM = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = d.getHours();
  const mm = d.getMinutes();
  const ss = d.getSeconds();

  const formattedString = format
    .replace('yyyy', String(yyyy))
    .replace('MM', String(MM))
    .replace('dd', String(dd))
    .replace('hh', String(hh))
    .replace('mm', String(mm))
    .replace('ss', String(ss));

  return formattedString;
}
