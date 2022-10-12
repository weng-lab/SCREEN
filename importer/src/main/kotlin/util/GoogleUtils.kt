package util

import com.google.api.gax.paging.Page
import com.google.cloud.storage.*
import java.nio.channels.Channels

val storage: Storage by lazy {  StorageOptions.getDefaultInstance().service }

fun gsList(bucket: String, gsPath: String? = null): List<Blob> {
    val prefixOptions = mutableListOf(Storage.BlobListOption.currentDirectory())
    if (gsPath != null) {
        val prefixPath =
            if (gsPath.endsWith("/")) gsPath
            else "$gsPath/"
        prefixOptions += Storage.BlobListOption.prefix(prefixPath)
    }

    val blobs = mutableListOf<Blob>()
    var currentPage: Page<Blob>? = null
    do {
        currentPage = if (currentPage == null) {
            storage.list(bucket, *prefixOptions.toTypedArray())
        } else {
            currentPage.nextPage
        }
        blobs += currentPage.values
    } while (currentPage?.hasNextPage() == true)
    return blobs.toList()
}

fun gsInputStream(bucket: String, gsObject: String) = Channels.newInputStream(storage.reader(bucket, gsObject))