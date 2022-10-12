package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class VersioningImporter(private val sources: List<VersioningSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running metadata schema..." }
        executeSqlResource(dataSource, "schemas/groundlevelversioning.sql")
        VersioningSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Ground Level Versioining import complete!" }
        log.info { "Ground Level Versioining import running post script!" }
        executeSqlResource(dataSource, "schemas/groundlevelversioning-post.sql")
        log.info { "Ground Level Versioining import completed running post script!" }
    }
}

interface VersioningSource {
    fun import(sink: VersioningSink)
}

private const val VERSIONING_FILES_TABLE_DEF = "grch38_ground_level_versions(accession, biosample, assay, version)"

class VersioningSink(dataSource: DataSource): Closeable {

    private val versioningFilesOut = CopyValueWriter(dataSource, VERSIONING_FILES_TABLE_DEF)

    fun versioningFile(accession: String, biosample: String, assay: String, version: String) =
            versioningFilesOut.write(accession,biosample, assay, version)

    override fun close() {
        versioningFilesOut.close()
    }
}