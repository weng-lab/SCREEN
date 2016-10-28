import React, {PropTypes} from 'react'
import RangeFacet from '../../../common/components/range'
import {wrap_facet} from '../helpers/create_facet'

const MainRangeFacet = ({title, visible, h_margin, h_interval, range, selection_range, onchange, h_data, updateWidth}) => {
    return wrap_facet(visible,
		      <RangeFacet h_margin={h_margin} h_interval={h_interval} onchange={onchange} updateWidth={updateWidth}
		          title={title} range={range} selection_range={selection_range} h_data={h_data} />);
};

MainRangeFacet.propTypes = {
    visible: PropTypes.bool.isRequired,
    onchange: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    h_margin: PropTypes.shape({
	top: PropTypes.number.isRequired,
	bottom: PropTypes.number.isRequired,
	left: PropTypes.number.isRequired,
	right: PropTypes.number.isRequired
    }).isRequired,
    h_interval: PropTypes.number.isRequired,
    selection_range: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
    range: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
    h_data: PropTypes.arrayOf(PropTypes.shape({
	key: PropTypes.number.isRequired,
	doc_count: PropTypes.number.isRequired
    }).isRequired)
};

export default MainRangeFacet;
