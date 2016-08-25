DROP MATERIALIZED VIEW IF EXISTS bed_ranges_{tablesuffix};

CREATE MATERIALIZED VIEW re_bed_intersection_{tablesuffix}
AS SELECT
   re.accession AS re_accession,
   bed_ranges_{tablesuffix}.file_accession AS file_accession,
   bed_ranges_{tablesuffix}.startend * re.startend AS overlap,
   upper(overlap) - lower(overlap) AS overlap_bp,
   overlap_bp / (upper(re.startend) - lower(re.startend)) AS overlap_pct
FROM
   re,
   bed_ranges_{tablesuffix}
WHERE
   overlap_bp > 0
;
