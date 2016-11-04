var React = require('react');
var $ = require('jquery');

import {create_venn_diagram} from '../helpers/venn'

class VennDiagram extends React.Component {

    constructor(props) {
	super(props);
    }

    componentDidUpdate() {
	$(this.refs.container).empty();
	if (this.props.sets && this.props.sets.length > 0) {
	    create_venn_diagram(this.refs.container, this.props.sets, this.props.overlaps, this.refs.tooltip);
	}
    }
    
    render() {
	return (<div>
		   <div ref="container" style={{width: this.props.width, height: this.props.height}} />
		   <div ref="tooltip" className="venntooltip" />
		</div>);
    }
    
}
export default VennDiagram;
