import { db } from './db';

const TOKEN_KEY = 'TOKEN';

const isLogin = () => {
  return !!db.get(TOKEN_KEY)?.token && !!db.get('USER')?.account;
};

const isInitRouter = () => {
  return (!(db.get('USER_ROUTER') === undefined || db.get('USER_ROUTER') === null));
};

const getToken = () => {
  return db.get(TOKEN_KEY);
};

const setToken = (token: string) => {
  db.save(TOKEN_KEY, token);
};

const clearLoginMessage = () => {
  db.remove(TOKEN_KEY);
  db.remove('PERMISSIONS');
  db.remove('USER');
  db.remove('USER_ROUTER');
};

const setPermissionsList = (permissionsList: any) => {
  db.save('PERMISSIONS', permissionsList);
};

const getPermissionsList = () => {
  return db.get('PERMISSIONS');
};

const setUser = (user: any) => {
  db.save('USER', user);
};

const getUser = () => {
  return db.get('USER');
};

const setRoutes = (routes: any) => {
  db.save('USER_ROUTER', routes);
};

const getRoutes = () => {
  return db.get('USER_ROUTER');
};

export {
  isLogin,
  getToken,
  setToken,
  clearLoginMessage,
  setPermissionsList,
  getPermissionsList,
  setUser,
  getUser,
  setRoutes,
  getRoutes,
  isInitRouter
};
