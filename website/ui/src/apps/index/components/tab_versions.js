/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from 'react';

import {tabPanelize} from '../../../common/utility';

//import TabDataCcREs from './tab_data_ccres';
import TabDataScreen from './tab_versions_screen';

class TabVersions extends React.Component {
    key = "versions";

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

export default TabVersions;
