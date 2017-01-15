var React = require('react');
import {render} from 'react-dom'
import HelpIcon from './help_icon'

class REComponent extends React.Component {

    constructor(props) {
	super(props);
    }

    render(subcomponent = <div />) {
	return subcomponent;
    }

    componentDidUpdate() {}

    componentDidMount() {
	if (!this.refs.help_icon) return;
	var help = (this.props.helpkey ? <HelpIcon helpkey={this.props.helpkey} /> : <span />);
	render(help, this.refs.help_icon);
    }

}
export default REComponent;
