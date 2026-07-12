-- Attendance table
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrived_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  status attendance_status NOT NULL DEFAULT 'present',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- KPI targets (monthly target per employee)
CREATE TABLE kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  target_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- KPI results (actual production per month)
CREATE TABLE kpi_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  quantity_produced NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bonus_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payroll_id UUID REFERENCES payrolls(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- Indexes
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_kpi_targets_month_year ON kpi_targets(month, year);
CREATE INDEX idx_kpi_results_month_year ON kpi_results(month, year);

-- RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_results ENABLE ROW LEVEL SECURITY;

-- Attendance RLS
CREATE POLICY "Employee can view own attendance" ON attendance
  FOR SELECT USING (
    employee_id IN (SELECT employee_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "HR and above can manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'hr'))
  );

-- KPI targets RLS
CREATE POLICY "HR and above can manage KPI targets" ON kpi_targets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'hr'))
  );

CREATE POLICY "Employee can view own KPI targets" ON kpi_targets
  FOR SELECT USING (
    employee_id IN (SELECT employee_id FROM users WHERE id = auth.uid())
  );

-- KPI results RLS
CREATE POLICY "HR and above can manage KPI results" ON kpi_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin', 'hr'))
  );

CREATE POLICY "Employee can view own KPI results" ON kpi_results
  FOR SELECT USING (
    employee_id IN (SELECT employee_id FROM users WHERE id = auth.uid())
  );
