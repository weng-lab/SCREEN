import React, {PropTypes} from 'react'
import ChecklistFacet from '../../../common/components/checklist'
import {wrap_facet} from '../helpers/create_facet'

const MainChecklistFacet = ({visible, title, items, onchange, match_mode_enabled, onModeChange, autocomplete_source}) => {
    return wrap_facet(visible,
		      <ChecklistFacet items={items} title={title} onchange={onchange}
		         match_mode_enabled={match_mode_enabled} onModeChange={onModeChange}
		         autocomplete_source={autocomplete_source} />);
};

MainChecklistFacet.propTypes = {
    visible: PropTypes.bool.isRequired,
    onchange: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
	value: PropTypes.string.isRequired,
	checked: PropTypes.bool.isRequired
    }).isRequired).isRequired,
    match_mode_enabled: PropTypes.bool,
    autocomplete_source: PropTypes.arrayOf(PropTypes.string)
};

export default MainChecklistFacet;
