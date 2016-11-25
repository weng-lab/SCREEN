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
    "liver": "#884400",
    "lung": "#CCCCCC",
    "mammary": "#991111",
    "muscle": "#119911",
    "pancreas": "#AA88AA",
    "placenta": "#FF9977",
    "prostate": "#00AA88",
    "skin": "#BBAA44",
    "stomach": "#44AAFF",
    "uterus": "#990033"
};

const tissue_name = (cell_type) => (
    (cell_type in GlobalTissueMap) ? GlobalTissueMap[cell_type] : ""
);

const tissue_color = (cell_type) => {
    if (!(cell_type in GlobalTissueMap)) return "#000000";
    var tissue = GlobalTissueMap[cell_type];
    return (tissue in TissueColors ? TissueColors[tissue] : "#000000");
};

export const tissue_label_formatter = (d) => {
    var t = tissue_name(d);
    return {
	name: friendly_celltype(d) + (t == "" ? "" : " (" + t + ")"),
	style: {
	    "fill": tissue_color(d)
	}
    };
};
