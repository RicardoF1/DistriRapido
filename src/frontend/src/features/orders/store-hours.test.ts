import { to24Hour, isStoreHour, is12HourDraft } from './store-hours';
it.each([['07:00', 'AM', '07:00'], ['12:00', 'PM', '12:00'], ['12:00', 'AM', '00:00'], ['02:00', 'PM', '14:00'], ['08:00', 'PM', '20:00']])('convierte %s %s a Lima de 24 horas', (time, period, expected) => {
  expect(to24Hour(time, period)).toBe(expected);
});
it.each(['00:00', '13:00', '25:00', '12:75', 'texto'])('rechaza formato de 12 horas inválido %s', time => expect(to24Hour(time, 'AM')).toBeNull());
it.each([['06:59', false, false], ['07:00', true, true], ['12:59', true, true], ['13:00', false, true], ['13:30', false, false], ['14:00', true, true], ['19:59', true, true], ['20:00', false, true], ['20:01', false, false], ['00:00', false, false]])('valida extremos de atención %s', (time, start, end) => {
  expect(isStoreHour(time, 'inicio')).toBe(start); expect(isStoreHour(time, 'fin')).toBe(end);
});

it.each(['', '0', '1', '3', '12', '09:', '09:3', '09:30', '12:59'])('permite edición parcial válida %s', value => expect(is12HourDraft(value)).toBe(true));
it.each(['32', '13', '00', '23:00', '12:6', '12:75', 'texto'])('bloquea entrada imposible %s', value => expect(is12HourDraft(value)).toBe(false));
