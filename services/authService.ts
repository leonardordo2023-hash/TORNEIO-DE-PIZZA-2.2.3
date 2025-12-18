
import { UserAccount } from "../types";
import { securityService } from "./securityService";
import { supabase } from "./supabaseClient";

/**
 * SQL PARA CONFIGURAÇÃO NO SUPABASE (Copie e cole no SQL Editor do Supabase):
 * 
 * CREATE TABLE IF NOT EXISTS public.users (
 *   nickname TEXT PRIMARY KEY,
 *   phone TEXT,
 *   password TEXT,
 *   isVerified BOOLEAN DEFAULT true,
 *   avatar TEXT,
 *   cover TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
 * );
 */

const USERS_KEY = 'pizza_users_db';
const CURRENT_USER_KEY = 'pizza_current_user';

export const authService = {
    // Sincroniza a lista local de usuários com o Supabase
    syncUsers: async (): Promise<UserAccount[]> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*');
            
            if (error) {
                if (error.message.includes('public.users')) {
                    console.error("ALERTA SUPABASE: A tabela 'users' não existe no banco de dados.");
                } else {
                    throw error;
                }
            }
            
            if (data) {
                const cleanData = securityService.deepClean(data);
                localStorage.setItem(USERS_KEY, JSON.stringify(cleanData));
                return cleanData;
            }
        } catch (e) {
            console.warn("Supabase sync failed, using local fallback", e);
        }
        return authService.getUsers();
    },

    getUsers: (): UserAccount[] => {
        try {
            const stored = localStorage.getItem(USERS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    },

    registerUser: async (user: UserAccount): Promise<void> => {
        try {
            // Salva no Supabase
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
                if (error.message.includes('public.users')) {
                    throw new Error("O banco de dados online ainda não foi configurado pelo administrador.");
                }
                throw error;
            }

            // Atualiza localmente
            const users = authService.getUsers();
            if (!users.some(u => u.nickname.toLowerCase() === user.nickname.toLowerCase())) {
                users.push(user);
                localStorage.setItem(USERS_KEY, JSON.stringify(securityService.deepClean(users)));
            }
        } catch (e: any) {
            console.error("Error registering user in Supabase", e);
            throw new Error(e.message || "Falha ao salvar no banco de dados.");
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
            
            if (error && !error.message.includes('public.users')) throw error;
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
        localStorage.setItem(USERS_KEY, JSON.stringify(securityService.deepClean(users)));
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
