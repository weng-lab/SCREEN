import MainTabInfo from './maintabs.js'

const initialState = () => {
    const defaultTab = "figs";
    let maintabs = MainTabInfo();
    maintabs[defaultTab].visible = true;

    return {
        maintabs,
        maintabs_active: defaultTab,
        maintabs_visible: true,
    };
}

export default initialState;
