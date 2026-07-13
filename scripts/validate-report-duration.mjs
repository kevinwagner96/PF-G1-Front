#!/usr/bin/env node

import { performance } from 'node:perf_hooks'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3010/api/v1'
const DEFAULT_YEAR = 2026
const DEFAULT_SURGERIES_PER_MONTH = 500
const WARMUP_RUNS = 2
const MEASURED_RUNS = 10

function parseArgs(argv) {
  const args = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
    year: Number(process.env.REPORT_VALIDATION_YEAR ?? DEFAULT_YEAR),
    surgeriesPerMonth: Number(process.env.REPORT_VALIDATION_SURGERIES_PER_MONTH ?? DEFAULT_SURGERIES_PER_MONTH),
    email: process.env.REPORT_VALIDATION_EMAIL ?? 'admin@hospital.com',
    password: process.env.REPORT_VALIDATION_PASSWORD ?? 'admin123',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]
    if (arg === '--') {
      continue
    } else if (arg === '--api-base-url' && next) {
      args.apiBaseUrl = next
      index += 1
    } else if (arg === '--year' && next) {
      args.year = Number(next)
      index += 1
    } else if (arg === '--surgeries-per-month' && next) {
      args.surgeriesPerMonth = Number(next)
      index += 1
    } else if (arg === '--email' && next) {
      args.email = next
      index += 1
    } else if (arg === '--password' && next) {
      args.password = next
      index += 1
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`Argumento no reconocido: ${arg}`)
    }
  }

  if (!Number.isInteger(args.year) || args.year < 2000) {
    throw new Error('--year debe ser un año válido')
  }
  if (!Number.isInteger(args.surgeriesPerMonth) || args.surgeriesPerMonth < 1) {
    throw new Error('--surgeries-per-month debe ser mayor a cero')
  }

  args.apiBaseUrl = args.apiBaseUrl.replace(/\/$/, '')
  return args
}

function printHelp() {
  console.log(`
Uso:
  pnpm validate:reports
  pnpm validate:reports -- --year 2026 --surgeries-per-month 500

Variables:
  NEXT_PUBLIC_API_BASE_URL
  REPORT_VALIDATION_YEAR
  REPORT_VALIDATION_SURGERIES_PER_MONTH
  REPORT_VALIDATION_EMAIL
  REPORT_VALIDATION_PASSWORD
`)
}

class CookieJar {
  #cookies = new Map()

  store(response) {
    const setCookie = getSetCookieHeaders(response.headers)
    for (const cookieHeader of setCookie) {
      const [cookiePair] = cookieHeader.split(';')
      const separatorIndex = cookiePair.indexOf('=')
      if (separatorIndex === -1) continue
      const name = cookiePair.slice(0, separatorIndex)
      const value = cookiePair.slice(separatorIndex + 1)
      this.#cookies.set(name, value)
    }
  }

  header() {
    return Array.from(this.#cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ')
  }

  get(name) {
    return this.#cookies.get(name)
  }
}

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const combinedHeader = headers.get('set-cookie')
  if (!combinedHeader) return []

  return combinedHeader.split(/,(?=\s*[^;,=\s]+=[^;,]+)/)
}

async function requestJson({ apiBaseUrl, jar, path, method = 'GET', body }) {
  const headers = {
    'Content-Type': 'application/json',
  }
  const cookieHeader = jar.header()
  if (cookieHeader) headers.Cookie = cookieHeader

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = jar.get('csrftoken')
    if (csrfToken) headers['X-CSRFToken'] = csrfToken
  }

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new Error(`No se pudo conectar con el Back en ${apiBaseUrl}: ${error.message}`)
  }

  jar.store(response)
  const responseText = await response.text()
  const data = responseText ? JSON.parse(responseText) : null

  if (!response.ok) {
    const detail = data?.detail ?? responseText
    throw new Error(`HTTP ${response.status} en ${path}: ${detail}`)
  }

  return data
}

async function authenticate(config, jar) {
  await requestJson({ ...config, jar, path: '/auth/csrf/' })
  await requestJson({
    ...config,
    jar,
    path: '/auth/login/',
    method: 'POST',
    body: {
      email: config.email,
      password: config.password,
    },
  })
}

function monthRange(year, month) {
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
  const dateTo = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
  return { dateFrom, dateTo }
}

function annualRange(year) {
  return {
    dateFrom: `${year}-01-01`,
    dateTo: `${year}-12-31`,
  }
}

async function fetchReport(config, jar, range) {
  const params = new URLSearchParams({
    date_from: range.dateFrom,
    date_to: range.dateTo,
  })
  const startedAt = performance.now()
  const data = await requestJson({
    ...config,
    jar,
    path: `/reports/summary/?${params}`,
  })
  const durationMs = performance.now() - startedAt
  return { data, durationMs }
}

async function warmup(config, jar, range) {
  for (let index = 0; index < WARMUP_RUNS; index += 1) {
    await fetchReport(config, jar, range)
  }
}

async function measureSeries(config, jar, label, ranges) {
  const results = []
  for (let index = 0; index < ranges.length; index += 1) {
    const result = await fetchReport(config, jar, ranges[index])
    results.push(result)
    const total = totalSurgeries(result.data)
    console.log(
      `${label} ${String(index + 1).padStart(2, '0')}: ${formatMs(result.durationMs)} ` +
      `(${ranges[index].dateFrom} a ${ranges[index].dateTo}, ${total} cirugias)`,
    )
  }
  return results
}

function totalSurgeries(report) {
  return report.details.statuses.reduce((sum, item) => sum + item.count, 0)
}

function stats(results) {
  const values = results.map((result) => result.durationMs)
  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`
}

function printStats(label, results) {
  const summary = stats(results)
  console.log(
    `${label}: promedio=${formatMs(summary.average)}, min=${formatMs(summary.min)}, max=${formatMs(summary.max)}`,
  )
}

function assertDataset({ monthlyResults, annualResults, config }) {
  const missingMonths = monthlyResults
    .map((result, index) => ({ month: index + 1, total: totalSurgeries(result.data) }))
    .filter((item) => item.total < config.surgeriesPerMonth)

  if (missingMonths.length > 0) {
    const months = missingMonths.map((item) => `${item.month} (${item.total})`).join(', ')
    throw new Error(
      `Dataset insuficiente para reportes mensuales. Esperado >= ${config.surgeriesPerMonth} por mes; ` +
      `meses insuficientes: ${months}. Ejecuta en el Back: ` +
      `python manage.py seed_report_validation --year ${config.year} --surgeries-per-month ${config.surgeriesPerMonth}`,
    )
  }

  const expectedAnnualSurgeries = config.surgeriesPerMonth * 12
  const annualTotal = totalSurgeries(annualResults[0].data)
  if (annualTotal < expectedAnnualSurgeries) {
    throw new Error(
      `Dataset anual insuficiente. Esperado >= ${expectedAnnualSurgeries}, recibido ${annualTotal}. ` +
      `Ejecuta en el Back: python manage.py seed_report_validation --year ${config.year} ` +
      `--surgeries-per-month ${config.surgeriesPerMonth}`,
    )
  }
}

async function main() {
  const config = parseArgs(process.argv.slice(2))
  const jar = new CookieJar()
  const monthlyRanges = Array.from({ length: MEASURED_RUNS }, (_, index) => monthRange(config.year, index + 1))
  const annualRanges = Array.from({ length: MEASURED_RUNS }, () => annualRange(config.year))

  console.log('Validation test de duracion de reportes')
  console.log(`API: ${config.apiBaseUrl}`)
  console.log(`Dataset esperado: ${config.surgeriesPerMonth} cirugias/mes, año ${config.year}`)
  console.log('')

  await authenticate(config, jar)
  console.log(`Warmup: ${WARMUP_RUNS} reportes no contados`)
  await warmup(config, jar, monthlyRanges[0])
  console.log('')

  console.log('Reportes mensuales')
  const monthlyResults = await measureSeries(config, jar, 'Mensual', monthlyRanges)
  console.log('')

  console.log('Reportes anuales')
  const annualResults = await measureSeries(config, jar, 'Anual', annualRanges)
  console.log('')

  assertDataset({ monthlyResults, annualResults, config })

  console.log('Resumen')
  printStats('Mensual', monthlyResults)
  printStats('Anual', annualResults)
}

main().catch((error) => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
