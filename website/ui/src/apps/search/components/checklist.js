import React, {PropTypes} from 'react'
import ChecklistFacet from '../../../common/components/checklist'
import {wrap_facet} from '../helpers/create_facet'

const MainChecklistFacet = ({visible, title, items, onchange}) => {
    return wrap_facet(visible,
		      <ChecklistFacet items={items} title={title} onchange={onchange} />);
};

MainChecklistFacet.propTypes = {
    visible: PropTypes.bool.isRequired,
    onchange: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool.isRequired
    }).isRequired).isRequired
};

export default MainChecklistFacet;
