package source

import import.*
import model.*
import mu.KotlinLogging
import util.*
import java.io.File

import java.io.*
import java.util.zip.GZIPInputStream


private val log = KotlinLogging.logger {}
fun fileNamePrefix(fileName: String) = fileName.split('.').first()


class VersioningFileSource(private val files: List<File>) : VersioningSource {
    override fun import(sink: VersioningSink) {
        log.info { "Beginning Genes Associations File Import" }
        for (file in files) {
            log.info { "Importing Genes Associations from file $file" }
            val fileName = fileNamePrefix(file.getName())
            log.info { "file name is: $fileName" }
         
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))

            reader.forEachLine { line ->
                log.info {"$line"}
                val fn = fileName.split("_")
                val lineValues = line.split("\t")
                var month = fn[1]
                if(month.startsWith("0")){
                    month = fn[1][1].toString()
                }

                sink.versioningFile(lineValues[0],lineValues[1],lineValues[2],fn[0]+"-"+month)
                
            }
        }
    }
}

class GSVersioningSource(private val gsParentPath: GSDirectory) : VersioningSource {
    override fun import(sink: VersioningSink) {
        log.info { "Beginning Versioning GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  !it.isDirectory && it.name.endsWith(".tsv") }
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing Versioning from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName = fileNamePrefix(f.name.split("/").last())
            log.info { "fileName is: $fileName" }
            val fn = fileName.split("_")
            var month = fn[1]
            if(month.startsWith("0")){
                month = fn[1][1].toString()
            }
            val yearmonth = fn[0]+"-"+month
            log.info { "year and month is: $yearmonth" }

            val ip = f.getContent().inputStream()
            val reader =  ip.bufferedReader() //BufferedReader(InputStreamReader(GZIPInputStream(FileInputStream(file))))

            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.versioningFile(lineValues[0],lineValues[1],lineValues[2],yearmonth)


            }
        }

    }
}
