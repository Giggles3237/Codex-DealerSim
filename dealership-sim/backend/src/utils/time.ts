import dayjs from 'dayjs';

export const formatDate = (day: number, month: number, year: number) => {
  return dayjs().year(year).month(month - 1).date(day).format('YYYY-MM-DD');
};

export const formatMonth = (month: number, year: number) => {
  return dayjs().year(year).month(month - 1).format('YYYY-MM');
};
