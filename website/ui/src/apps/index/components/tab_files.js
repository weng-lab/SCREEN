import React from 'react'

import {tabPanelize} from '../../../common/utility'

class TabFiles extends React.Component {
    constructor(props) {
	super(props);
        this.key = "tutorial"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.key === nextProps.maintabs_active;
    }

    render() {
        return (tabPanelize(
            <div>
                <h2>Files</h2>

		
		
	    </div>));
    }
}

export default TabFiles;
