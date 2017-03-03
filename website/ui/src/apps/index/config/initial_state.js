import MainTabsConfig from '../config/maintabs_config'

const initialState = () => {
    return {
        maintabs: MainTabsConfig(),
        maintabs_active: "main",
        maintabs_visible: true,
        genes: null
    };
}

export default initialState;
