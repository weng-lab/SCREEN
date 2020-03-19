import React from 'react'

import DeExp from '../components/de_exp'

class DePage extends React.Component{
    render() {
        return (
	    <div>
		{React.createElement(DeExp, this.props)}
            </div>);
    }
}

const MainTabInfo = () => ({
    de_expression: {title: "Diff Expression", visible: true, f: DePage},
});

export default MainTabInfo;
