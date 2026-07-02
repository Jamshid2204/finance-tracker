"use client"

import { useState } from "react"

export function usePagination(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = useState(initialPage)
  const [pageSize] = useState(initialPageSize)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  return {
    pagination: { page, pageSize, search, sortBy, sortOrder },
    setPage,
    setSearch,
    setSortBy: (field: string) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortBy(field)
        setSortOrder("asc")
      }
    },
  }
}
