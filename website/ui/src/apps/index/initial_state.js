import MainTabsConfig from './tabs/maintabs_config'

const initialState = () => ({
    maintabs: MainTabConfig(),
    maintabs_active: "results",
    maintabs_visible: true
});

export default initialState;
