export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString('ru-RU');
}
