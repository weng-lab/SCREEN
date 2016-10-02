import React, {PropTypes} from 'react'
import LongListFacet from '../../../common/components/longlist'
import {wrap_facet} from '../helpers/create_facet'

const MainLongListFacet = ({visible, title, data, cols, order, selection, onTdClick}) => {
    return wrap_facet(visible,
		      <LongListFacet data={data} cols={cols} order={order} onTdClick={onTdClick} selection={selection} title={title} />);
};

MainLongListFacet.propTypes = {
    visible: PropTypes.bool.isRequired,
    onTdClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    data: PropTypes.any.isRequired,
    order: PropTypes.any.isRequired,
    cols: PropTypes.any.isRequired,
    selection: PropTypes.any.isRequired
};

export default MainLongListFacet;
