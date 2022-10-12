package model


data class GSFile(val bucket: String, val filePath: String)
data class GSDirectory(val bucket: String, val dirPath: String?)

fun String.toGSFile(): GSFile {
    val parts = this.split(":")
    if (parts.size != 2) throw Exception("Invalid Google Storage file format.")
    return GSFile(parts[0], parts[1])
}

fun String.toGSDirectory(): GSDirectory {
    val parts = this.split(":")
    return GSDirectory(parts[0], parts.getOrNull(1))
}