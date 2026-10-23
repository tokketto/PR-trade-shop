import { NextResponse } from 'next/server'
import { KvError } from './kv'

export function databaseErrorResponse(err: unknown, fallback: string, opts?: { preferFallback?: boolean }) {
  const message = !opts?.preferFallback && err instanceof KvError && err.userFacing ? err.message : fallback
  const detail = err instanceof KvError ? err.message : err instanceof Error ? err.name : 'error'
  console.error(fallback, detail)
  return NextResponse.json({ error: message }, { status: 500 })
}
