var React = require('react');
var $ = require('jquery');

import {create_venn_diagram} from '../helpers/venn'
import REComponent from './re_component'

class VennDiagram extends REComponent {

    constructor(props) {
	super(props);
    }

    componentDidUpdate() {
	super.componentDidUpdate();
	$(this.refs.container).empty();
	if (this.props.sets && this.props.sets.length > 0) {
	    create_venn_diagram(this.refs.container, this.props.sets, this.props.overlaps, this.refs.tooltip);
	}
    }
    
    render() {
	return super.render(<div>
		   <span ref="help_icon" />
		   <div ref="container" style={{width: this.props.width, height: this.props.height}} />
		   <div ref="tooltip" className="venntooltip" />
		</div>);
    }

    componentDidMount() {
	super.componentDidMount();
    }
    
}
export default VennDiagram;
