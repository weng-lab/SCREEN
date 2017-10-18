import {Enum} from 'enumify';

class SortOrder extends Enum {
    cycleOrder(){
        switch (this) {
	    case SortOrder.DISABLED:
		return SortOrder.DISABLED;
	    case SortOrder.NONE:
		return SortOrder.ASC;
	    case SortOrder.ASC:
		return SortOrder.DSC;
	    case SortOrder.DSC:
		return SortOrder.ASC;
	    default:
		return SortOrder.NONE;
	}
    }
}
SortOrder.initEnum(['ASC', 'DSC', 'NONE', 'DISABLED']);

export default SortOrder;