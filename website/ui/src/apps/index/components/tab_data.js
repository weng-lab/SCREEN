import React from 'react';

import {tabPanelize} from '../../../common/utility';

//import TabDataCcREs from './tab_data_ccres';
import TabDataScreen from './tab_data_screen';

class TabData extends React.Component {
    key = "input_data";

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}

	return (tabPanelize(
            <div>
		<TabDataScreen />
	    </div>));
    }
}

export default TabData;
