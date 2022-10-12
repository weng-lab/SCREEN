import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.*
import com.github.ajalt.clikt.parameters.types.file
import com.github.ajalt.clikt.parameters.types.int
import import.*
import source.*
import com.zaxxer.hikari.*
import javax.sql.DataSource
import java.sql.DriverManager
import mu.KotlinLogging
import util.withEnvvarSplit
import java.io.File
import model.*

private val log = KotlinLogging.logger {}

interface Importer {
    fun import(dataSource: DataSource)
}

fun main(args: Array<String>) = Cli().main(args)

class Cli : CliktCommand() {

    private val dbUrl by option("--db-url", envvar = "DB_URL").required()
    private val dbUsername by option("--db-username", envvar = "DB_USERNAME")
    private val dbPassword by option("--db-password", envvar = "DB_PASSWORD")
    private val dbSchema by option("--db-schema", envvar = "DB_SCHEMA")
    private val replaceSchema by option("--replace-schema", envvar = "REPLACE_SCHEMA",
            help = "Set to drop the given schema first before creating it again.")
            .flag(default = false)
    private val versioningFiles by option("-versioningf", "--versioning-files", envvar = "VERSIONING_FILES",
            help = "versioning files")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val versioningGSBase by option("-versioningcgsbase","--versioning-gsdir",
            envvar = "VERSIONING_GS_DIR", help = "Import versioning from files in the given google storage base path.")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
     
    override fun run() {
        val importers = mutableListOf<Importer>()
     
        //import versioning
        val versioningSources = mutableListOf<VersioningSource>()
        if(versioningGSBase.isNotEmpty()){
            versioningSources += versioningGSBase.map { GSVersioningSource(it.toGSDirectory()) }
        }

        if(versioningFiles.isNotEmpty()){
            versioningSources += versioningFiles.map { VersioningFileSource(listOf(File(it))) }
        }

        if(versioningSources.isNotEmpty()) importers += VersioningImporter(versioningSources)

        runImporters(dbUrl, dbUsername, dbPassword, dbSchema, replaceSchema, importers)
    }

}

fun runImporters(dbUrl: String,
                 dbUsername: String? = null,
                 dbPassword: String? = null,
                 dbSchema: String? = null,
                 replaceSchema: Boolean = false,
                 importers: List<Importer>) {

    // Create the schema if it does not exist.
    DriverManager.getConnection(dbUrl, dbUsername, dbPassword).use { conn ->
        conn.createStatement().use { stmt ->
            if (replaceSchema) {
              stmt.executeUpdate("DROP SCHEMA IF EXISTS $dbSchema CASCADE")
            }
            stmt.executeUpdate("CREATE SCHEMA IF NOT EXISTS $dbSchema")
            log.info { "created dbschema $dbSchema" }           
        }
    }

    val config = HikariConfig()
    config.jdbcUrl = dbUrl
    config.username = dbUsername
    config.password = dbPassword
    config.schema = dbSchema!!.toLowerCase()
    config.minimumIdle = 1
    config.maximumPoolSize = 100

    HikariDataSource(config).use { dataSource ->
        for (importer in importers) {
           importer.import(dataSource)
        }
    }

}
