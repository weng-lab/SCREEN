import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import model.PsychEncodeDataset
import mu.KotlinLogging
import okhttp3.mockwebserver.*
import okio.*
import source.*
import java.io.File
import java.sql.*

private val log = KotlinLogging.logger {}

const val BASE_DB_URL = "jdbc:postgresql://localhost:5555/postgres"
const val TEST_SCHEMA = "genes_test"
const val DB_URL = "$BASE_DB_URL?currentSchema=$TEST_SCHEMA"
const val DB_USERNAME = "postgres"

class AppTest : StringSpec() {

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")
    }

    init {

        "Genes Associations import from local file" {
            val testFile = File(AppTest::class.java.getResource("2020_01_GRCh38.tsv").file)

            val importers: List<Importer> = listOf(
                VersioningImporter(listOf(VersioningFileSource(listOf(testFile))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            checkQuery("SELECT COUNT(*) FROM grch38_ground_level_versions ") { result ->
                result.next()
                result.getInt(1) shouldBe 9045
            }
            checkQuery("SELECT * FROM grch38_ground_level_versions LIMIT 1") { result ->
                result.next()
                result.getString("version") shouldBe "2020-1"
            }
        }

    }
}


fun checkQuery(sql: String, check: (result: ResultSet) -> Unit) {
    DriverManager.getConnection(DB_URL, DB_USERNAME, null).use { conn ->
        conn.createStatement().use { stmt ->
            check(stmt.executeQuery(sql))
        }
    }
}

fun executeAdminUpdates(vararg sqlUpdates: String) {
    DriverManager.getConnection(BASE_DB_URL, DB_USERNAME, null).use { conn ->
        conn.createStatement().use { stmt ->
            for (sql in sqlUpdates) stmt.executeUpdate(sql)
        }
    }
}

fun MockWebServer.queueTextFromResource(resource: String, bodyTransform: ((String) -> String)? = null) {
    var body = AppTest::class.java.getResource(resource).readText()
    if (bodyTransform != null) body = bodyTransform(body)
    this.enqueue(MockResponse().setBody(body))
}

fun MockWebServer.queueBytesFromResource(resource: String) {
    val body = Buffer()
    body.writeAll(Okio.source(File(AppTest::class.java.getResource(resource).file)))
    this.enqueue(MockResponse().setBody(body))
}
