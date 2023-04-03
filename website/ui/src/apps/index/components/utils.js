import { useState, useEffect } from "react"

export function useGetDownloadFileUrl(primaryurl, secondaryurl) {
  const [url, setUrl] = useState(primaryurl)
  useEffect(() => {
    fetch(primaryurl, { method: "HEAD" })
      .then((res) => {
        if (res.status !== 200) {
          setUrl(secondaryurl)
        }
      })
      .catch((e) => {
        setUrl(secondaryurl)
      })
  }, [primaryurl, secondaryurl])
  return url
}
