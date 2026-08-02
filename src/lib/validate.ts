export interface ValidationIssue {
  path: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

const CODE_PATTERN = /^\d{2}[A-Z]{2,3}\d{3}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function validateTimetable(raw: unknown): ValidationResult {
  const issues: ValidationIssue[] = []

  if (!isRecord(raw)) {
    return {
      ok: false,
      issues: [
        {
          path: "$",
          message: "Expected a JSON object with subjects, config, slots, and schedule.",
        },
      ],
    }
  }

  for (const key of ["subjects", "config", "slots", "schedule"]) {
    if (!isRecord(raw[key])) {
      issues.push({ path: key, message: `Missing "${key}" — expected an object.` })
    }
  }

  const subjects = isRecord(raw.subjects) ? raw.subjects : {}
  const config = isRecord(raw.config) ? raw.config : {}
  const slots = isRecord(raw.slots) ? raw.slots : {}
  const schedule = isRecord(raw.schedule) ? raw.schedule : {}
  const subjectKeys = new Set(Object.keys(subjects))
  const slotKeys = new Set(Object.keys(slots))
  const configKeys = new Set(Object.keys(config))

  for (const [key, value] of Object.entries(subjects)) {
    const path = `subjects.${key}`
    if (!isRecord(value)) {
      issues.push({ path, message: "Expected an object with name, code, faculty, and shortName." })
      continue
    }
    if (typeof value.name !== "string" || !value.name.trim()) {
      issues.push({ path: `${path}.name`, message: "Missing subject name." })
    }
    if (typeof value.shortName !== "string" || !value.shortName.trim()) {
      issues.push({ path: `${path}.shortName`, message: "Missing short name." })
    }
    if (typeof value.code !== "string" || !CODE_PATTERN.test(value.code)) {
      issues.push({
        path: `${path}.code`,
        message: `Code should look like "23CSE301" (got ${JSON.stringify(value.code)}).`,
      })
    }
    if (!Array.isArray(value.faculty) || value.faculty.some((f) => typeof f !== "string")) {
      issues.push({
        path: `${path}.faculty`,
        message: `Faculty must be an array of names (got ${JSON.stringify(value.faculty)}).`,
      })
    }
  }

  for (const [key, value] of Object.entries(config)) {
    const path = `config.${key}`
    if (!isRecord(value)) {
      issues.push({ path, message: "Expected an object with a label and a list of values." })
      continue
    }
    if (typeof value.label !== "string" || !value.label.trim()) {
      issues.push({ path: `${path}.label`, message: "Missing label." })
    }
    if (!Array.isArray(value.values) || value.values.length === 0) {
      issues.push({ path: `${path}.values`, message: "Need at least one option with a label and an id." })
    } else {
      value.values.forEach((option, i) => {
        if (
          !isRecord(option) ||
          typeof option.label !== "string" ||
          typeof option.id !== "string"
        ) {
          issues.push({ path: `${path}.values[${i}]`, message: "Each option needs a label and an id." })
        }
      })
    }
  }

  for (const [key, value] of Object.entries(slots)) {
    const path = `slots.${key}`
    if (!isRecord(value)) {
      issues.push({ path, message: "Expected a slot with match and choices." })
      continue
    }
    const match = value.match
    const matchKeys = Array.isArray(match) ? match : [match]
    if (!matchKeys.every((m) => typeof m === "string")) {
      issues.push({ path: `${path}.match`, message: "Match must be a config key or an array of config keys." })
    } else {
      for (const m of matchKeys) {
        if (typeof m === "string" && !configKeys.has(m)) {
          issues.push({
            path: `${path}.match`,
            message: `Match "${m}" doesn't match any config key (${[...configKeys].join(", ") || "none"}).`,
          })
        }
      }
    }

    const checkSlotValue = (choiceValue: unknown, choicePath: string) => {
      if (typeof choiceValue !== "string") {
        issues.push({
          path: choicePath,
          message: `Choice value must be a subject key, "FREE", or a key ending in _LAB (got ${JSON.stringify(choiceValue)}).`,
        })
        return
      }
      const base = choiceValue.endsWith("_LAB") ? choiceValue.slice(0, -4) : choiceValue
      if (choiceValue !== "FREE" && !subjectKeys.has(base)) {
        issues.push({
          path: choicePath,
          message: `"${choiceValue}" doesn't reference any subject (${[...subjectKeys].join(", ") || "none"}).`,
        })
      }
    }

    const choices = value.choices
    if (Array.isArray(choices)) {
      choices.forEach((choice, i) => {
        if (!isRecord(choice) || !Array.isArray(choice.pattern) || !choice.pattern.every((p) => typeof p === "string")) {
          issues.push({ path: `${path}.choices[${i}]`, message: "Each choice needs a pattern array and a value." })
          return
        }
        checkSlotValue(choice.value, `${path}.choices[${i}].value`)
      })
    } else if (isRecord(choices)) {
      for (const [choiceKey, choiceValue] of Object.entries(choices)) {
        checkSlotValue(choiceValue, `${path}.choices.${choiceKey}`)
      }
    } else {
      issues.push({ path: `${path}.choices`, message: "Expected an object mapping ids to values, or an array of patterns." })
    }
  }

  for (const [day, periods] of Object.entries(schedule)) {
    const path = `schedule.${day}`
    if (!Array.isArray(periods)) {
      issues.push({ path, message: "Expected an array of 7 periods." })
      continue
    }
    if (periods.length !== 7) {
      issues.push({ path, message: `Expected exactly 7 periods, got ${periods.length}.` })
    }
    periods.forEach((period, i) => {
      if (typeof period !== "string") {
        issues.push({ path: `${path}[${i}]`, message: "Period must be a string." })
        return
      }
      const base = period.endsWith("_LAB") ? period.slice(0, -4) : period
      if (period !== "FREE" && !subjectKeys.has(base) && !slotKeys.has(period)) {
        issues.push({
          path: `${path}[${i}]`,
          message: `"${period}" is not a subject, a slot, or FREE.`,
        })
      }
    })
  }

  return { ok: issues.length === 0, issues }
}
