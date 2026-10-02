-- Time-based KPI: employees store monthly target hours
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS monthly_target_hours NUMERIC(12, 2) NOT NULL DEFAULT 160;

-- KPI targets now store target hours (per month) and rate per extra hour
ALTER TABLE kpi_targets
  ADD COLUMN IF NOT EXISTS target_hours NUMERIC(12, 2) NOT NULL DEFAULT 160;

-- KPI results store actual worked hours (auto from attendance, manually correctable)
ALTER TABLE kpi_results
  ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Helper: compute monthly worked hours from attendance (left_at - arrived_at per day)
CREATE OR REPLACE FUNCTION get_monthly_hours(emp_id UUID, m INTEGER, y INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT arrived_at, left_at FROM attendance
    WHERE employee_id = emp_id
      AND date >= make_date(y, m, 1)
      AND date < (make_date(y, m, 1) + interval '1 month')
  LOOP
    IF rec.arrived_at IS NOT NULL AND rec.left_at IS NOT NULL THEN
      total := total + EXTRACT(EPOCH FROM (rec.left_at - rec.arrived_at)) / 3600;
    END IF;
  END LOOP;
  RETURN ROUND(total, 2);
END;
$$ LANGUAGE plpgsql;
