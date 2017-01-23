export const friendly_celltype = (c) => (
    c.replace(/_/g, " ").replace(/\\u03bc/g, '\u03bc')
);

export const TissueColors = {
    "blood": "#880000",
    "bone marrow": "#AACCAA",
    "brain": "#AA8888",
    "breast": "#33AA00",
    "colon": "#AAAA55",
    "embryonic structure": "#AAAAFF",
    "ESC": "#77AA44",
    "eye": "#6600CC",
    "fat": "#999955",
    "heart": "#880055",
    "intestine": "#9900AA",
    "kidney": "#77AABB",
    "limb": "#9999FF",
    "liver": "#884400",
    "lung": "#CCCCCC",
    "mammary": "#991111",
    "muscle": "#119911",
    "pancreas": "#AA88AA",
    "placenta": "#FF9977",
    "prostate": "#00AA88",
    "skin": "#BBAA44",
    "stomach": "#9900FF",
    "uterus": "#990033"
};

export const primary_cell_colors = {
    "paraxial mesoderm derivative": "#999900",
    "endothelia": "#990099",
    "ectoderm": "009999",
    "endoderm": "#000099",
    "hemocytoblast derivatives": "#990000",
    "unknown": "#000000"
};

export const infer_primary_type = (cell_type, tissue) => {
    if (cell_type.includes("fibroblast"))
	return "paraxial mesoderm derivative";
    else if (cell_type.includes("endotheli"))
	return "endothelia";
    else if (cell_type.includes("keratinocyte"))
	return "ectoderm";
    else if (cell_type.includes("epitheli"))
	return "endoderm";
    else if (tissue == "blood")
	return "hemocytoblast derivatives";
    return "unknown";
};

export const primary_cell_color = (d) => {
    return primary_cell_colors[infer_primary_type(d, tissue_name(d))];
};

export const tissue_name = (cell_type) => {
    if(GlobalTissueMap){
        if(cell_type in GlobalTissueMap){
            return GlobalTissueMap[cell_type];
        }
    }
    return "";
};

export const name_and_tissue = (d) => {
    var t = tissue_name(d);
    return friendly_celltype(d) + (t == "" ? "" : " (" + t + ")");
};

export const tissue_color = (cell_type) => {
    if(!GlobalTissueMap){ return  "#000000"; }
    if (!(cell_type in GlobalTissueMap)) { return "#000000"; }
    var tissue = GlobalTissueMap[cell_type];
    return (tissue in TissueColors ? TissueColors[tissue] : "#000000");
};

export const tissue_label_formatter = (d) => {
    return {
	name: name_and_tissue(d),
	style: {
	    "fill": tissue_color(d)
	}
    };
};

export const primary_cell_label_formatter = (d) => {
    return {
	name: d,
	style: {
	    fill: primary_cell_color(d)
	}
    };
};
