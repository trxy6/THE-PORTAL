export const store = {
  get(key: string, fallback: any) {
    try {
      const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
      const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
      const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
      const v = localStorage.getItem(finalKey);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key: string, val: any) {
    try {
      const loggedInUser = localStorage.getItem('portal_current_user') || 'guest';
      const isGlobal = (key === 'portal_users' || key === 'global_feedback_ideas' || key === 'portal_current_user');
      const finalKey = isGlobal ? key : `${loggedInUser}_${key}`;
      localStorage.setItem(finalKey, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  },
};
