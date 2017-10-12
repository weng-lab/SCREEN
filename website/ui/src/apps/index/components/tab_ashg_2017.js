import React from 'react'

import {tabPanelize} from '../../../common/utility'

class TabAshg2017 extends React.Component {
    constructor(props) {
	super(props);
        this.key = "ashg_2017"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if(this.key !== this.props.maintabs_active){
	    return false;
	}
	    
	return (tabPanelize(
            <div>
                <h2>ASHG 2017</h2>
	    </div>));
    }
}

export default TabAshg2017;
