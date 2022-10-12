package model

import com.squareup.moshi.Json
import java.util.*

/*
 * Search Results Model
 */
data class EncodeSearchResult(@Json(name = "@graph") val graph: List<SearchGraphEntry>)

data class SearchGraphEntry(val accession: String)

/*
 * Experiment Metadata Results Model
 */
data class EncodeExperiment(
        val accession: String,
        val assembly: List<String>,
        val award: Award,
        val lab: Lab,
        @Json(name = "assay_title") val assayTitle: String?,
        @Json(name = "biosample_ontology") val biosampleOntology: BiosampleOntology,
        val target: ExperimentTarget?,
        @Json(name = "date_released") val dateReleased: Date?,
        val replicates: List<Replicate>,
        val files: List<ExperimentFile>
)

data class ExperimentTarget(val label: String)
data class BiosampleOntology(
        val classification: String,
        @Json(name = "term_name") val termName: String,
        @Json(name = "organ_slims") val organSlims: List<String>
)

data class Award(val pi: PI?, val project: String)
data class PI(val title: String, val lab: Lab)
data class Lab(val name: String)

data class Replicate(val library: ReplicateLibrary)
data class ReplicateLibrary(val biosample: ReplicateBiosample)
data class ReplicateBiosample(
        val organism: ReplicateOrganism,
        @Json(name = "subcellular_fraction_term_name") val subcellularFractionTermName: String?
)
data class ReplicateOrganism(@Json(name = "scientific_name") val scientificName: String)

data class ExperimentFile(
        val accession: String?,
        val assembly: String?,
        val status: String,
        @Json(name = "file_type") val fileType: String,
        @Json(name = "output_category") val outputCategory: String,
        @Json(name = "output_type") val outputType: String,
        @Json(name = "run_type") val runType: String?,
        @Json(name = "paired_end") val pairedEnd: String?,
        @Json(name = "technical_replicates") val technicalReplicates: List<String>,
        @Json(name = "biological_replicates") val biologicalReplicates: List<String>,
        @Json(name = "cloud_metadata") val cloudMetadata: CloudMetadata?,
        @Json(name = "analysis_step_version") val analysisStepVersion: AnalysisStepVersion?
)

data class AnalysisStepVersion(@Json(name = "analysis_step") val analysisStep: AnalysisStep?)
data class AnalysisStep(val pipelines: List<Pipeline>)
data class Pipeline(val title: String)
data class CloudMetadata(val url: String)
/*
 * Experiment Metadata Results Model
 */
data class PsychEncodeDataset(
        val name: String,
        val datasetAccession: String
)

/*
 * Some helper functions
 */
fun EncodeExperiment.tissue() = if (biosampleOntology.organSlims.isEmpty()) null else biosampleOntology.organSlims[0]

fun ExperimentFile.isReleased() = status == "released"

fun ExperimentFile.isSignal() = outputCategory == "signal"
fun ExperimentFile.isUniqueReads() =
        listOf(
                "signal of unique reads",
                "plus strand signal of unique reads",
                "minus strand signal of unique reads"
        ).contains(outputType)
fun ExperimentFile.signalStrand() = when (outputType) {
        "plus strand signal of unique reads", "plus strand signal of all reads" -> '+'
        "minus strand signal of unique reads", "minus strand signal of all reads" -> '-'
        else -> '.'
}

fun ExperimentFile.isQuantification() = outputCategory == "quantification"
fun ExperimentFile.isGeneQuantification() = outputType == "gene quantifications"
fun ExperimentFile.isTranscriptQuantification() = outputType == "transcript quantifications"

fun ExperimentFile.biorep() = if (this.biologicalReplicates.isNotEmpty()) this.biologicalReplicates[0] else null
fun ExperimentFile.techrep() = if (this.technicalReplicates.isNotEmpty()) this.technicalReplicates[0].split("_")[1] else null