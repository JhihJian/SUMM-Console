interface Config {
  port: number
  summDir: string
  summWorkDir: string
  anthropicApiKey?: string
}

function loadConfig(): Config {
  const port = Number(process.env.PORT) || 3000
  const summDir = process.env.SUMM_DIR || './SUMM'
  const summWorkDir = process.env.SUMM_WORK_DIR || process.cwd()
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  return {
    port,
    summDir,
    summWorkDir,
    anthropicApiKey
  }
}

export const config = loadConfig()
