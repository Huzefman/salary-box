import { getActor, assertRole } from '../_shared/auth.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { ok, err, cors, handleError } from '../_shared/response.ts'

type RowResult = { row: number; error: string }

const REQUIRED_COLS = ['first_name', 'last_name', 'email', 'employment_type', 'join_date']
const ALLOWED_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contractor', 'intern']
const ALLOWED_GENDERS = ['male', 'female', 'other']

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
  return { headers, rows }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors()

  try {
    const actor = await getActor(req)
    assertRole(actor, ['owner'])

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return err('VALIDATION_ERROR', 'file is required', 400)

    const text = await file.text()
    const { headers, rows } = parseCSV(text)

    if (!rows.length) {
      return err('VALIDATION_ERROR', 'CSV file is empty or has no data rows', 400)
    }

    const missingHeaders = REQUIRED_COLS.filter((c) => !headers.includes(c))
    if (missingHeaders.length > 0) {
      return err('VALIDATION_ERROR', `Missing required columns: ${missingHeaders.join(', ')}`, 400)
    }

    const supabase = getServiceClient()

    const { data: deptList } = await supabase.from('departments').select('id, name').eq('is_active', true)
    const { data: desigList } = await supabase.from('designations').select('id, name').eq('is_active', true)
    const { data: mgrList } = await supabase.from('employees').select('id, email').eq('is_active', true).in('role', ['owner', 'hr'])

    const departments = new Map(deptList?.map((d) => [d.name.toLowerCase(), d.id]) ?? [])
    const designations = new Map(desigList?.map((d) => [d.name.toLowerCase(), d.id]) ?? [])
    const managers = new Map(mgrList?.map((m) => [m.email.toLowerCase(), m.id]) ?? [])

    const successes: Record<string, unknown>[] = []
    const failures: RowResult[] = []
    const year = new Date().getFullYear().toString()

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2
      const errors: string[] = []

      if (!r.first_name) errors.push('first_name is required')
      if (!r.last_name) errors.push('last_name is required')
      if (!r.email) errors.push('email is required')
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) errors.push('Invalid email format')
      if (!r.join_date) errors.push('join_date is required')
      if (!r.employment_type) errors.push('employment_type is required')
      else if (!ALLOWED_EMPLOYMENT_TYPES.includes(r.employment_type)) errors.push(`employment_type must be one of: ${ALLOWED_EMPLOYMENT_TYPES.join(', ')}`)

      if (r.gender && !ALLOWED_GENDERS.includes(r.gender)) errors.push(`gender must be one of: ${ALLOWED_GENDERS.join(', ')}`)
      if (r.department_name && !departments.has(r.department_name.toLowerCase())) errors.push(`Department not found: '${r.department_name}'`)
      if (r.designation_name && !designations.has(r.designation_name.toLowerCase())) errors.push(`Designation not found: '${r.designation_name}'`)
      if (r.reporting_manager_email && !managers.has(r.reporting_manager_email.toLowerCase())) errors.push(`Reporting manager not found: '${r.reporting_manager_email}'`)

      if (errors.length > 0) {
        failures.push({ row: rowNum, error: errors.join('; ') })
        continue
      }

      const { count } = await supabase
        .from('employees')
        .select('*', { head: true, count: 'exact' })
        .like('employee_code', `EMP-${year}-%`)
      const nextSeq = ((count ?? 0) + successes.length + 1).toString().padStart(4, '0')
      const employeeCode = `EMP-${year}-${nextSeq}`

      const today = new Date().toISOString().split('T')[0]
      const joinDate = r.join_date
      const isFutureJoiner = joinDate > today

      const { data: emp, error: insertErr } = await supabase
        .from('employees')
        .insert({
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
          employee_code: employeeCode,
          phone: r.phone || null,
          date_of_birth: r.date_of_birth || null,
          gender: (r.gender as typeof ALLOWED_GENDERS[number]) || null,
          role: 'employee',
          employment_type: r.employment_type as typeof ALLOWED_EMPLOYMENT_TYPES[number],
          employment_status: isFutureJoiner ? 'future_joiner' : 'active',
          join_date: joinDate,
          department_id: r.department_name ? departments.get(r.department_name.toLowerCase()) : null,
          designation_id: r.designation_name ? designations.get(r.designation_name.toLowerCase()) : null,
          reporting_manager_id: r.reporting_manager_email ? managers.get(r.reporting_manager_email.toLowerCase()) : null,
          current_salary: r.current_salary ? Number(r.current_salary) : null,
          probation_end_date: r.probation_end_date || null,
          is_first_login: false,
          is_active: true,
          created_by: actor.actorId,
        })
        .select('id')
        .single()

      if (insertErr || !emp) {
        failures.push({ row: rowNum, error: `DB insert failed: ${insertErr?.message ?? 'Unknown'}` })
      } else {
        successes.push({ id: emp.id, employee_code: employeeCode, email: r.email })
      }
    }

    return ok({
      total_rows: rows.length,
      success_count: successes.length,
      failure_count: failures.length,
      failures,
    })
  } catch (e) {
    return handleError(e)
  }
})
