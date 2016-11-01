import React, {PropTypes} from 'react'
import ListFacet from '../../../common/components/list'
import {wrap_facet} from '../helpers/create_facet'

const MainListFacet = ({visible, title, items, selection, onchange}) => {
    return wrap_facet(visible,
		      <ListFacet items={items} onchange={onchange} selection={selection} title={title} />);
};

MainListFacet.propTypes = {
    visible: PropTypes.bool.isRequired,
    onchange: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    items: PropTypes.any.isRequired,
    selection: PropTypes.string
};

export default MainListFacet;
