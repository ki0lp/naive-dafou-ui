import {useRouter} from 'vue-router';

export default function useUser() {
    const router = useRouter();
    const logout = async (logoutTo?: string) => {
        const currentRoute = router.currentRoute.value;
        // @ts-ignore
        window.$message.success('登出成功');
        router.push({
            name: logoutTo && typeof logoutTo === 'string' ? logoutTo : 'login',
            query: {
                ...router.currentRoute.value.query,
                redirect: currentRoute.name as string
            }
        });
    };
    return {
        logout
    };
}
