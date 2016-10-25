import React, {PropTypes} from 'react'
import LongChecklistFacet from '../../../common/components/longchecklist'
import {wrap_facet} from '../helpers/create_facet'

const MainLongChecklistFacet = ({visible, title, data, cols, order, onTdClick, match_mode_enabled, onModeChange, mode}) => {
    return wrap_facet(visible,
		      <LongChecklistFacet data={data} cols={cols} order={order} onTdClick={onTdClick} title={title}
		          match_mode_enabled={match_mode_enabled} mode={mode} onModeChange={onModeChange} />);
};

MainLongChecklistFacet.propTypes = {
    visible: PropTypes.bool.isRequired,
    onTdClick: PropTypes.func.isRequired,
    onModeChange: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    data: PropTypes.any.isRequired,
    order: PropTypes.any.isRequired,
    cols: PropTypes.any.isRequired,
    match_mode_enabled: PropTypes.bool,
    mode: PropTypes.string.isRequired
};

export default MainLongChecklistFacet;
