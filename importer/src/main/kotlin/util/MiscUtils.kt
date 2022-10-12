package util

import com.github.ajalt.clikt.parameters.options.OptionWithValues
import mu.KotlinLogging
import java.io.File

private val log = KotlinLogging.logger {}

// Helps override Clikt splitters when setting for env vars.
// Better solution may become available in Clikt library when https://github.com/ajalt/clikt/issues/48 is resolved.
fun <AllT, EachT, ValueT> OptionWithValues<AllT, EachT, ValueT>.withEnvvarSplit(envvarSplit: Regex)
        = copy(transformValue, transformEach, transformAll, envvarSplit = envvarSplit)

/**
 * Utility function for easily retrying an arbitrary block of code the given number of times before failing.
 */
fun <T> retry(name: String, numOfRetries: Int, block: () -> T): T {
    var throwable: Throwable? = null
    (1..numOfRetries).forEach { attempt ->
        try {
            return block()
        } catch (e: Throwable) {
            throwable = e
            log.error(e) { "Failed $name attempt $attempt / $numOfRetries" }
        }
    }
    throw throwable!!
}
