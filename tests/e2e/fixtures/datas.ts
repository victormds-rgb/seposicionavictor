/**
 * Formata uma data futura no formato esperado por
 * `<input type="datetime-local">` (YYYY-MM-DDTHH:mm).
 */
export function dataHoraLocalDaquiA(minutos: number): string {
  const data = new Date(Date.now() + minutos * 60_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(
    data.getHours()
  )}:${pad(data.getMinutes())}`;
}
