-- Created by Vertabelo (http://vertabelo.com)
-- Last modification date: 2016-12-15 18:13:32.212

-- tables
-- Table: cell_types
CREATE TABLE cell_types (
    ct_id int  NOT NULL,
    ct text  NOT NULL,
    tissue text  NOT NULL,
    type text  NOT NULL,
    display_ct int  NOT NULL,
    encode_files_encode_id int  NOT NULL,
    CONSTRAINT cell_types_pk PRIMARY KEY (ct_id)
);

-- Table: encode_files
CREATE TABLE encode_files (
    encode_id int  NOT NULL,
    accession varchar(11)  NOT NULL,
    ct_id int  NOT NULL,
    CONSTRAINT encode_files_pk PRIMARY KEY (encode_id)
);

-- Table: gene
CREATE TABLE gene (
    gene_id int  NOT NULL,
    name text  NOT NULL,
    ensembl text  NOT NULL,
    CONSTRAINT gene_pk PRIMARY KEY (gene_id)
);

-- Table: hg19_cre
CREATE TABLE hg19_cre (
    cre_id int  NOT NULL,
    accession varchar(20)  NOT NULL,
    neg_log_p real  NOT NULL,
    version int  NOT NULL,
    chrom int  NOT NULL,
    start int  NOT NULL,
    "end" int  NOT NULL,
    master_peak_id text  NOT NULL,
    CONSTRAINT hg19_cre_pk PRIMARY KEY (cre_id)
);

CREATE INDEX accession on hg19_cre (accession ASC);

-- Table: hg19_gene_nearest
CREATE TABLE hg19_gene_nearest (
    id int  NOT NULL,
    cre_id int  NOT NULL,
    pc_ids int  NOT NULL,
    pc_distances int  NOT NULL,
    all_ids int  NOT NULL,
    all_distances int  NOT NULL,
    CONSTRAINT hg19_gene_nearest_pk PRIMARY KEY (id)
);

-- Table: hg19_peak_intersections
CREATE TABLE hg19_peak_intersections (
    id int  NOT NULL,
    cre_id int  NOT NULL,
    assay varchar(10)  NOT NULL,
    mark text  NOT NULL,
    accessions text  NOT NULL,
    CONSTRAINT hg19_peak_intersections_pk PRIMARY KEY (id)
);

-- Table: hg19_ranks
CREATE TABLE hg19_ranks (
    id int  NOT NULL,
    cre_id int  NOT NULL,
    ctcf_only__rank int  NOT NULL,
    ctcf_dnase__rank int  NOT NULL,
    ctcf_dnase__zscore real  NOT NULL,
    ctcf_dnase__ctcf_bigwig real  NOT NULL,
    ctcf_dnase__ctcf_zscore real  NOT NULL,
    ctcf_dnase__ctcf_signal int  NOT NULL,
    ctcf_dnase__dnase_bigwig int  NOT NULL,
    ctcf_dnase__dnase_zscore real  NOT NULL,
    ctcf_dnase__dnase_signal real  NOT NULL,
    dnase__rank int  NOT NULL,
    dnase__bigwig int  NOT NULL,
    dnase__zscore real  NOT NULL,
    dnase__signal real  NOT NULL,
    enhancer_h3k27ac_only__rank int  NOT NULL,
    enhancer_h3k27ac_only__zscore real  NOT NULL,
    enhancer_h3k27ac_only__bigwig int  NOT NULL,
    enhancer_h3k27ac_only__signal real  NOT NULL,
    enhancer_h3k27ac_dnase__rank int  NOT NULL,
    enhancer_h3k27ac_dnase__zscore real  NOT NULL,
    enhancer_h3k27ac_dnase__h3k27ac_bigwig int  NOT NULL,
    enhancer_h3k27ac_dnase__h3k27ac_signal real  NOT NULL,
    enhancer_h3k27ac_dnase__h3k27ac_zscore real  NOT NULL,
    enhancer_h3k27ac_dnase__dnase_bigwig int  NOT NULL,
    enhancer_h3k27ac_dnase__dnase_zscore real  NOT NULL,
    enhancer_h3k27ac_dnase__dnase_signal real  NOT NULL,
    promoter_h3k4me3_only__rank int  NOT NULL,
    promoter_h3k4me3_only__zscore real  NOT NULL,
    promoter_h3k4me3_only__bigwig int  NOT NULL,
    promoter_h3k4me3_only__signal real  NOT NULL,
    promoter_h3k4me3_dnase__rank int  NOT NULL,
    promoter_h3k4me3_dnase__zscore real  NOT NULL,
    promoter_h3k4me3_dnase__dnase_bigwig int  NOT NULL,
    promoter_h3k4me3_dnase__dnase_signal real  NOT NULL,
    promoter_h3k4me3_dnase__dnase_zscore real  NOT NULL,
    promoter_h3k4me3_dnase__h3k4me3_bigwig int  NOT NULL,
    promoter_h3k4me3_dnase__h3k4me3_zscore real  NOT NULL,
    promoter_h3k4me3_dnase__h3k4me3_signal real  NOT NULL,
    conservation__phastCons_100way_vert real  NOT NULL,
    conservation__phastCons_46way_vert real  NOT NULL,
    conservation__phastCons_mammal real  NOT NULL,
    conservation__phastCons_primate real  NOT NULL,
    conservation__phyloP_100way_vert real  NOT NULL,
    conservation__phyloP_46way_vert real  NOT NULL,
    conservation__phyloP_mammal real  NOT NULL,
    conservation__phyloP_primate real  NOT NULL,
    CONSTRAINT hg19_ranks_pk PRIMARY KEY (id)
);

-- foreign keys
-- Reference: cell_types_encode_files (table: encode_files)
ALTER TABLE encode_files ADD CONSTRAINT cell_types_encode_files
    FOREIGN KEY (ct_id)
    REFERENCES cell_types (ct_id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: gene_nearest_cre_hg19 (table: hg19_gene_nearest)
ALTER TABLE hg19_gene_nearest ADD CONSTRAINT gene_nearest_cre_hg19
    FOREIGN KEY (cre_id)
    REFERENCES hg19_cre (cre_id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: hg19_ranks_hg19_cre (table: hg19_ranks)
ALTER TABLE hg19_ranks ADD CONSTRAINT hg19_ranks_hg19_cre
    FOREIGN KEY (cre_id)
    REFERENCES hg19_cre (cre_id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- Reference: peak_intersections_cre (table: hg19_peak_intersections)
ALTER TABLE hg19_peak_intersections ADD CONSTRAINT peak_intersections_cre
    FOREIGN KEY (cre_id)
    REFERENCES hg19_cre (cre_id)  
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE
;

-- End of file.

