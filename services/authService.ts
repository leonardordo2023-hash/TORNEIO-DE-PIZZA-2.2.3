
import { UserAccount } from "../types";
import { securityService } from "./securityService";
import { supabase } from "./supabaseClient";

const USERS_KEY = 'pizza_users_db';
const CURRENT_USER_KEY = 'pizza_current_user';

const REQUIRED_NAMES = [
    "@Adry", "@Ana Julia", "@Angelica", "@Elisa", "@Gecilda", 
    "@Marta", "@Neiva", "@Rebecca", "@Simone", "@Vania", "@Vanusa", "@Yulimar"
];

export const authService = {
    ensureRequiredProfiles: (currentUsers: UserAccount[]): UserAccount[] => {
        let updated = [...currentUsers];
        let changed = false;

        REQUIRED_NAMES.forEach(name => {
            if (!updated.some(u => u.nickname.toLowerCase() === name.toLowerCase())) {
                updated.push({
                    nickname: name,
                    phone: '',
                    password: '0000',
                    isVerified: true,
                    avatar: `https://ui-avatars.com/api/?name=${name.replace('@', '')}&background=random&color=fff`
                });
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem(USERS_KEY, JSON.stringify(securityService.deepClean(updated)));
        }
        return updated;
    },

    syncUsers: async (): Promise<UserAccount[]> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*');
            
            if (error) throw error;
            
            if (data) {
                const cleanData = securityService.deepClean(data);
                const completeData = authService.ensureRequiredProfiles(cleanData);
                localStorage.setItem(USERS_KEY, JSON.stringify(completeData));
                return completeData;
            }
        } catch (e: any) {
            console.warn("Supabase sync failed, using local fallback", e);
        }
        return authService.ensureRequiredProfiles(authService.getUsers());
    },

    getUsers: (): UserAccount[] => {
        try {
            const stored = localStorage.getItem(USERS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    },

    registerUser: async (user: UserAccount): Promise<void> => {
        try {
            const { error } = await supabase
                .from('users')
                .upsert({
                    nickname: user.nickname,
                    phone: user.phone,
                    password: user.password,
                    isVerified: user.isVerified,
                    avatar: user.avatar || '',
                    cover: user.cover || ''
                }, { onConflict: 'nickname' });

            if (error) {
                // Captura a mensagem de erro específica do Supabase em vez do objeto
                const errorMsg = error.message || JSON.stringify(error);
                throw new Error(errorMsg);
            }

            const users = authService.getUsers();
            if (!users.some(u => u.nickname.toLowerCase() === user.nickname.toLowerCase())) {
                users.push(user);
                localStorage.setItem(USERS_KEY, JSON.stringify(securityService.deepClean(users)));
            }
        } catch (e: any) {
            console.error("Error registering user in Supabase", e);
            // Garante que o erro retornado seja uma string para o UI
            throw new Error(e.message || "Erro de conexão com o banco de dados.");
        }
    },

    deleteUser: async (nickname: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('nickname', nickname);
            
            if (error) throw new Error(error.message);
            
            const users = authService.getUsers().filter(u => u.nickname !== nickname);
            localStorage.setItem(USERS_KEY, JSON.stringify(securityService.deepClean(users)));
        } catch (e: any) {
            console.error("Error deleting user", e);
            throw new Error(e.message || "Não foi possível excluir o perfil.");
        }
    },

    updateUser: async (currentNickname: string, updates: Partial<UserAccount>): Promise<UserAccount> => {
        const users = authService.getUsers();
        const userIndex = users.findIndex(u => u.nickname.toLowerCase() === currentNickname.toLowerCase());
        
        if (userIndex === -1) throw new Error("Usuário não encontrado.");
        
        const updatedUser = { ...users[userIndex], ...updates };
        
        try {
            const { error } = await supabase
                .from('users')
                .update(securityService.deepClean(updates))
                .eq('nickname', currentNickname);
            
            if (error) throw new Error(error.message);
        } catch (e) {
            console.error("Supabase update error", e);
        }

        users[userIndex] = updatedUser;
        localStorage.setItem(USERS_KEY, JSON.stringify(securityService.deepClean(users)));
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(securityService.deepClean(updatedUser)));
        
        return updatedUser;
    },

    mergeUsers: (newUsers: UserAccount[]) => {
        const users = authService.getUsers();
        newUsers.forEach(nu => {
            const idx = users.findIndex(u => u.nickname.toLowerCase() === nu.nickname.toLowerCase());
            if (idx >= 0) {
                users[idx] = { ...users[idx], ...nu };
            } else {
                users.push(nu);
            }
        });
        const complete = authService.ensureRequiredProfiles(users);
        localStorage.setItem(USERS_KEY, JSON.stringify(securityService.deepClean(complete)));
    },

    saveUser: (user: UserAccount) => {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(securityService.deepClean(user)));
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: (): UserAccount | null => {
        try {
            const stored = localStorage.getItem(CURRENT_USER_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    }
};
