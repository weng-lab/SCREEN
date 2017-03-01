import MainTabsConfig from '../config/maintabs_config'

const initialState = () => ({
    maintabs: MainTabsConfig(),
    maintabs_active: "results",
    maintabs_visible: true
});

export default initialState;
