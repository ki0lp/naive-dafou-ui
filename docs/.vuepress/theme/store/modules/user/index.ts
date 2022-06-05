import {defineStore} from 'pinia';
import {
    setToken,
    clearLoginMessage,
    getToken,
    getPermissionsList,
    setPermissionsList,
    getUser,
    setUser
} from '../../../utils/auth';
import {removeRouteListener} from '../../../utils/route-listener';
import {LoginData, UserState} from './types';

const useUserStore = defineStore('user', {
    state: (): UserState => ({
        name: undefined,
        avatar: undefined,
        job: undefined,
        organization: undefined,
        location: undefined,
        email: undefined,
        introduction: undefined,
        personalWebsite: undefined,
        jobName: undefined,
        organizationName: undefined,
        locationName: undefined,
        phone: undefined,
        registrationDate: undefined,
        accountId: undefined,
        certification: undefined,
        role: '',
        token: getToken(),
        expireTime: undefined,
        permissions: getPermissionsList(),
        user: getUser()
    }),

    getters: {
        userInfo(state: UserState): UserState {
            return {...state};
        }
    },

    actions: {
        // Login
        async login(loginForm: LoginData) {
            try {
                //const res: any = await userLogin(loginForm);
                const res = {
                    data: {
                        isSuccess: true,
                        data: {
                            token: {
                                expire: 2000
                            },
                            user: {}
                        }
                    }
                }
                //if (res?.data?.isSuccess) {
                //    // 保存token
                //    setToken(res?.data?.data?.token);
                //    this.token = res?.data?.data?.token;
                //
                //    // 设置保存时间
                //    const current = new Date();
                //    this.expireTime = current.setTime(
                //        current.getTime() + 1000 * res.data.data.token.expire
                //    );
                //
                //    // 保存用户信息
                //    this.user = res?.data?.data?.user;
                //    setUser(res?.data?.data?.user);
                //} else {
                //    throw new Error('登录失败');
                //}
                return res;
            } catch (err) {
                clearLoginMessage();
                throw err;
            }
        },

        // Logout
        async logout() {
            this.resetInfo();
            clearLoginMessage();
            removeRouteListener();
        },
    }
});

export default useUserStore;
