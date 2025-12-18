
export const backupService = {
    // Captura o estado atual completo de todos os LocalStorages relevantes
    getCurrentAppState: () => {
        return {
            pizzaGradeDataV2: localStorage.getItem('pizzaGradeDataV2'),
            pizza_social_data: localStorage.getItem('pizza_social_data'),
            pizza_users_db: localStorage.getItem('pizza_users_db'),
            pizza_hidden_users: localStorage.getItem('pizza_hidden_users'),
            tournament_dates_global: localStorage.getItem('tournament_dates_global'),
            pizza_theme: localStorage.getItem('pizza_theme'),
            pizza_language: localStorage.getItem('pizza_language'),
            pizza_notifications: localStorage.getItem('pizza_notifications')
        };
    },

    // Aplica um objeto de estado ao LocalStorage e recarrega
    applyRestore: (state: any) => {
        if (!state) return;
        
        Object.entries(state).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
                localStorage.setItem(key, value);
            } else if (value === null) {
                localStorage.removeItem(key);
            }
        });
        
        window.location.reload();
    }
};
