import React from 'react'

import * as Para from './utils';
import {tabPanelize} from '../common/utility'
import Tab from '../common/components/tab'
import Figure from './figure'

class TabFigs extends React.Component {
    constructor(props) {
	super(props);
        this.key = "figs"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        if (this.key !== this.props.maintabs_active) {
	    return false;
	}
        return (
	    <Tab>
		<Figure number={1} title={"Test"} style={{}} />
	    </Tab>
	);
    }
}

export default TabFigs;
