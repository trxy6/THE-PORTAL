import { store } from '../storage/localStore';

export function scheduleEvent(date: string, text: string, currentEvents: Record<string, string[]>) {
  const updatedEvents = { ...currentEvents };
  if (!updatedEvents[date]) {
    updatedEvents[date] = [];
  }
  updatedEvents[date] = [text, ...updatedEvents[date]];
  store.set('cal_events', updatedEvents);
  return { ok: true, updatedEvents };
}

export function createReminder(text: string, currentTasks: any[]) {
  const newT = {
    id: Date.now(),
    label: text,
    time: '12:00 PM',
    completed: false
  };
  const updatedTasks = [newT, ...currentTasks];
  store.set('pecos_tasks', updatedTasks);
  return { ok: true, updatedTasks, newTask: newT };
}
