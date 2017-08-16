import React from 'react';

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
	const main_figures = [1, 2, 3, 4, 5, 6, 7, 8];
        return (
	    <Tab>
	      {main_figures.map( i => (
	        <Figure number={i} title={""} style={{}} description={this.props.globals.legends[i - 1]} />
	      ) )}
            </Tab>
	);
    }
}

export default TabFigs;
